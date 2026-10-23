import {
  type Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/client';
import { generateRoomCode, getLocalUid, loadMyRoomCode, saveMyRoomCode } from '@/firebase/roomCode';
import { isNameTaken, nameTakenError } from '@/helpers/roomName';

// Hors du barrel de `helpers` : `firebase/firestore` est ESM seul et fait planter Jest des qu'il est requis.
// Tout ce qui est commun aux rooms (cycle de vie, presence, couleurs, reglages), lie a un jeu par `createRoomApi(game)` ;
// l'etat de manche reste dans le `room.ts` de chaque jeu, base sur `roomRef`.

/** Une room ne tient pas plus de joueurs connectes qu'il n'y a de couleurs. */
export const ROOM_MAX_PLAYERS = 10;

// `color` est attribuee par l'hote seul (`updateRoomPlayerColors`), jamais calculee localement.
// `lastSeen` est le heartbeat de l'appareil, compare seulement entre snapshots, jamais a une horloge locale.
export type RoomPlayer = { name: string; joinedAt: Timestamp | null; color?: string; lastSeen?: Timestamp | null };
export type RoomPlayers = Record<string, RoomPlayer>;

/** Dernier emoji envoye (`sendReaction`) ; `seq` (horloge de l'envoyeur, ms) distingue deux envois, jamais compare a une autre horloge. */
export type RoomReaction = { uid: string; emoji: string; seq: number };

/** Jeux ayant des rooms : valeur du champ `game`, fixee a la creation et immuable. */
export type RoomGame = 'compass';

/** Les rooms de tous les jeux partagent cette collection. */
const ROOMS_COLLECTION = 'rooms';

export const createRoomApi = <Settings extends object>(game: RoomGame) => {
  const roomRef = (code: string) => doc(db, ROOMS_COLLECTION, code);

  /** Supprime les rooms precedemment hebergees par cet uid (un hote n'a qu'une room a la fois). */
  const deletePreviousRoomsByHost = async (hostUid: string): Promise<void> => {
    const snapshot = await getDocs(query(collection(db, ROOMS_COLLECTION), where('hostUid', '==', hostUid)));
    await Promise.all(snapshot.docs.map((roomDoc) => deleteDoc(roomDoc.ref)));
  };

  /** Cree une room sous le dernier code de l'hote s'il est libre, sinon un code neuf (retente si collision).
   * Vide d'abord ses anciennes rooms (`deletePreviousRoomsByHost`) ; renvoie le code retenu. */
  const createRoom = async (settings: Settings): Promise<string> => {
    const hostUid = await getLocalUid();
    await deletePreviousRoomsByHost(hostUid);
    let remembered = await loadMyRoomCode();
    for (;;) {
      const code = remembered ?? generateRoomCode();
      remembered = null;
      const ref = roomRef(code);
      if ((await getDoc(ref)).exists()) continue;

      await setDoc(ref, { createdAt: serverTimestamp(), hostUid, game, settings });
      await saveMyRoomCode(code);
      return code;
    }
  };

  /** Une room de CE jeu existe-t-elle sous ce code ? Le code d'un autre jeu ne compte pas. */
  const roomExists = async (code: string): Promise<boolean> => {
    const snapshot = await getDoc(roomRef(code));
    return snapshot.exists() && snapshot.data()?.game === game;
  };

  /** Envoie les reglages de l'hote aux joiners. */
  const updateRoomSettings = (code: string, settings: Settings): Promise<void> =>
    updateDoc(roomRef(code), { settings });

  /** Reglages en direct : emet l'etat present puis chaque changement de l'hote. */
  const subscribeToRoomSettings = (code: string, onSettings: (settings: Settings) => void): (() => void) =>
    onSnapshot(roomRef(code), (snapshot) => {
      const settings = snapshot.data()?.settings as Settings | undefined;
      if (settings) onSettings(settings);
    });

  /**
   * Enregistre (ou renomme) cet appareil comme joueur ; renvoie son uid. Sans effet au-dela de `ROOM_MAX_PLAYERS`.
   * Leve `isNameTakenError` si le nom est pris. N'ecrit que `name`/`joinedAt` (chemins separes) : ecrire `players.{uid}`
   * en entier effacerait la couleur donnee par l'hote.
   */
  const joinRoomPresence = async (code: string, name: string): Promise<string> => {
    const uid = await getLocalUid();
    const ref = roomRef(code);
    const players = ((await getDoc(ref)).data()?.players as RoomPlayers | undefined) ?? {};
    const existing = players[uid];
    if (existing || Object.keys(players).length < ROOM_MAX_PLAYERS) {
      // Deux joueurs ne partagent pas un nom : le nouveau est refuse.
      if (isNameTaken(name, players, uid)) throw nameTakenError();
      await updateDoc(ref, {
        [`players.${uid}.name`]: name,
        [`players.${uid}.joinedAt`]: existing?.joinedAt ?? serverTimestamp(),
      });
    }
    return uid;
  };

  /** Retire un joueur : seul l'hote peut retirer un autre joueur. */
  const removeRoomPlayer = (code: string, uid: string): Promise<void> =>
    updateDoc(roomRef(code), { [`players.${uid}`]: deleteField() });

  /** Hote seul : supprime la room quand il quitte, pour que les joiners la voient disparaitre. */
  const deleteRoom = (code: string): Promise<void> => deleteDoc(roomRef(code));

  /** Hote seul : remet la room au salon (`screen: 'options'`), rien d'autre ; chaque `startRoomGame` reecrit la manche. */
  const restartRoom = (code: string): Promise<void> => updateDoc(roomRef(code), { screen: 'options' });

  /** Envoie un emoji a toute la room (champ `reaction` unique, ecrase ; regles `reactionOk`). */
  const sendReaction = async (code: string, emoji: string): Promise<void> => {
    const uid = await getLocalUid();
    await updateDoc(roomRef(code), { reaction: { uid, emoji, seq: Date.now() } satisfies RoomReaction });
  };

  /**
   * Incremente `lastSeen`. La promesse ne se resout qu'a l'acquittement serveur : c'est ainsi que `useRoomPresence`
   * detecte la perte de connexion.
   */
  const sendHeartbeat = (code: string, uid: string): Promise<void> =>
    updateDoc(roomRef(code), { [`players.${uid}.lastSeen`]: serverTimestamp() });

  /** Hote seul : efface les donnees de manche des joueurs partis (`useHostPruneLeavers`). */
  const pruneRoomPlayerData = (code: string, stale: Record<string, string[]>): Promise<void> => {
    const updates = Object.fromEntries(
      Object.entries(stale).flatMap(([field, uids]) => uids.map((uid) => [`${field}.${uid}`, deleteField()])),
    );
    return Object.keys(updates).length === 0 ? Promise.resolve() : updateDoc(roomRef(code), updates);
  };

  /** Hote seul : passe la main a `uid` (jeux a tour de role, `useHostTurnRecovery`). */
  const passRoomTurn = (code: string, uid: string): Promise<void> => updateDoc(roomRef(code), { turnUid: uid });

  /** Hote seul : ecrit les couleurs de plusieurs joueurs. Sans effet sur une map vide (Firestore refuse un update sans champ). */
  const updateRoomPlayerColors = (code: string, colorByUid: Record<string, string>): Promise<void> => {
    const entries = Object.entries(colorByUid).map(([uid, color]) => [`players.${uid}.color`, color]);
    return entries.length === 0 ? Promise.resolve() : updateDoc(roomRef(code), Object.fromEntries(entries));
  };

  /**
   * Joueurs connectes (par uid) et uid de l'hote. `exists` passe a faux quand la room disparait (distingue "room supprimee"
   * de "tous partis"). `screen` est inclus ici pour que l'ecran de preparation, deja abonne, voie le jeu demarrer.
   */
  const subscribeToRoomPlayers = <Screen extends string>(
    code: string,
    onUpdate: (
      players: RoomPlayers,
      hostUid: string | undefined,
      exists: boolean,
      screen: Screen,
      reaction: RoomReaction | null,
    ) => void,
  ): (() => void) =>
    onSnapshot(roomRef(code), (snapshot) => {
      const data = snapshot.data();
      onUpdate(
        (data?.players as RoomPlayers | undefined) ?? {},
        data?.hostUid as string | undefined,
        snapshot.exists(),
        (data?.screen as Screen | undefined) ?? ('options' as Screen),
        (data?.reaction as RoomReaction | undefined) ?? null,
      );
    });

  return {
    roomRef,
    createRoom,
    roomExists,
    updateRoomSettings,
    subscribeToRoomSettings,
    joinRoomPresence,
    removeRoomPlayer,
    deleteRoom,
    restartRoom,
    sendReaction,
    pruneRoomPlayerData,
    sendHeartbeat,
    passRoomTurn,
    updateRoomPlayerColors,
    subscribeToRoomPlayers,
  };
};
