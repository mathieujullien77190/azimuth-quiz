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
import { isNameTaken, nameTakenError } from '@/helpers/roomPlayers';
import type { GameSettings, Guess, Origin, Place, RoundScore } from '@/types';

// Hors barrel : `firebase/firestore` est ESM seul et plante Jest (voir `firebase/client.ts`). Cycle de vie de
// la room (creation, presence, couleurs, reglages) puis ce que Compass joue : chacun repond seul, puis reveal commun.

import { ROOM_GAME, ROOM_MAX_PLAYERS, ROOMS_COLLECTION } from '@/firebase/constants';

export { isValidRoomCode } from '@/firebase/roomCode';

// `color` est attribuee par l'hote seul (`updateRoomPlayerColors`), jamais calculee localement.
// `lastSeen` est le heartbeat de l'appareil, compare seulement entre snapshots, jamais a une horloge locale.
export type RoomPlayer = { name: string; joinedAt: Timestamp | null; color?: string; lastSeen?: Timestamp | null };
export type RoomPlayers = Record<string, RoomPlayer>;

/** Dernier emoji envoye (`sendReaction`) ; `seq` (horloge de l'envoyeur, ms) distingue deux envois, jamais compare a une autre horloge. */
export type RoomReaction = { uid: string; emoji: string; seq: number };

/** Ce que la room partage avec les joiners : tous les reglages sauf `playerName` (local). */
export type RoomSettings = Omit<GameSettings, 'playerName'>;

export const roomSettingsFrom = (settings: GameSettings): RoomSettings => {
  const { playerName, ...roomSettings } = settings;
  return roomSettings;
};

/** Ecran affiche par la room ; `'options'` (salon) par defaut quand le champ est absent. */
export type RoomScreen = 'options' | 'game' | 'reveal' | 'end';

const roomRef = (code: string) => doc(db, ROOMS_COLLECTION, code);

/** Supprime les rooms precedemment hebergees par cet uid (un hote n'a qu'une room a la fois). */
const deletePreviousRoomsByHost = async (hostUid: string): Promise<void> => {
  const snapshot = await getDocs(query(collection(db, ROOMS_COLLECTION), where('hostUid', '==', hostUid)));
  await Promise.all(snapshot.docs.map((roomDoc) => deleteDoc(roomDoc.ref)));
};

/** Cree une room sous le dernier code de l'hote s'il est libre, sinon un code neuf (retente si collision).
 * Vide d'abord ses anciennes rooms (`deletePreviousRoomsByHost`) ; renvoie le code retenu. */
export const createRoom = async (settings: RoomSettings): Promise<string> => {
  const hostUid = await getLocalUid();
  await deletePreviousRoomsByHost(hostUid);
  let remembered = await loadMyRoomCode();
  for (;;) {
    const code = remembered ?? generateRoomCode();
    remembered = null;
    const ref = roomRef(code);
    if ((await getDoc(ref)).exists()) continue;

    await setDoc(ref, { createdAt: serverTimestamp(), hostUid, game: ROOM_GAME, settings });
    await saveMyRoomCode(code);
    return code;
  }
};

/** Une room de CE jeu existe-t-elle sous ce code ? Le code d'un autre jeu ne compte pas. */
export const roomExists = async (code: string): Promise<boolean> => {
  const snapshot = await getDoc(roomRef(code));
  return snapshot.exists() && snapshot.data()?.game === ROOM_GAME;
};

/** Envoie les reglages de l'hote aux joiners. */
export const updateRoomSettings = (code: string, settings: RoomSettings): Promise<void> =>
  updateDoc(roomRef(code), { settings });

/** Reglages en direct : emet l'etat present puis chaque changement de l'hote. */
export const subscribeToRoomSettings = (code: string, onSettings: (settings: RoomSettings) => void): (() => void) =>
  onSnapshot(roomRef(code), (snapshot) => {
    const settings = snapshot.data()?.settings as RoomSettings | undefined;
    if (settings) onSettings(settings);
  });

/**
 * Enregistre (ou renomme) cet appareil comme joueur ; renvoie son uid. Sans effet au-dela de `ROOM_MAX_PLAYERS`.
 * Leve `isNameTakenError` si le nom est pris. N'ecrit que `name`/`joinedAt` (chemins separes) : ecrire `players.{uid}`
 * en entier effacerait la couleur donnee par l'hote.
 */
export const joinRoomPresence = async (code: string, name: string): Promise<string> => {
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
export const removeRoomPlayer = (code: string, uid: string): Promise<void> =>
  updateDoc(roomRef(code), { [`players.${uid}`]: deleteField() });

/** Hote seul : supprime la room quand il quitte, pour que les joiners la voient disparaitre. */
export const deleteRoom = (code: string): Promise<void> => deleteDoc(roomRef(code));

/** Hote seul : remet la room au salon (`screen: 'options'`), rien d'autre ; chaque `startRoomGame` reecrit la manche. */
export const restartRoom = (code: string): Promise<void> => updateDoc(roomRef(code), { screen: 'options' });

/** Envoie un emoji a toute la room (champ `reaction` unique, ecrase ; regles `reactionOk`). */
export const sendReaction = async (code: string, emoji: string): Promise<void> => {
  const uid = await getLocalUid();
  await updateDoc(roomRef(code), { reaction: { uid, emoji, seq: Date.now() } satisfies RoomReaction });
};

/**
 * Incremente `lastSeen`. La promesse ne se resout qu'a l'acquittement serveur : c'est ainsi que `useRoomPresence`
 * detecte la perte de connexion.
 */
export const sendHeartbeat = (code: string, uid: string): Promise<void> =>
  updateDoc(roomRef(code), { [`players.${uid}.lastSeen`]: serverTimestamp() });

/** Hote seul : efface les donnees de manche des joueurs partis (`useHostPruneLeavers`). */
export const pruneRoomPlayerData = (code: string, stale: Record<string, string[]>): Promise<void> => {
  const updates = Object.fromEntries(
    Object.entries(stale).flatMap(([field, uids]) => uids.map((uid) => [`${field}.${uid}`, deleteField()])),
  );
  return Object.keys(updates).length === 0 ? Promise.resolve() : updateDoc(roomRef(code), updates);
};

/** Hote seul : ecrit les couleurs de plusieurs joueurs. Sans effet sur une map vide (Firestore refuse un update sans champ). */
export const updateRoomPlayerColors = (code: string, colorByUid: Record<string, string>): Promise<void> => {
  const entries = Object.entries(colorByUid).map(([uid, color]) => [`players.${uid}.color`, color]);
  return entries.length === 0 ? Promise.resolve() : updateDoc(roomRef(code), Object.fromEntries(entries));
};

/**
 * Joueurs connectes (par uid) et uid de l'hote. `exists` passe a faux quand la room disparait (distingue "room supprimee"
 * de "tous partis"). `screen` est inclus ici pour que l'ecran de preparation, deja abonne, voie le jeu demarrer.
 */
export const subscribeToRoomPlayers = (
  code: string,
  onUpdate: (
    players: RoomPlayers,
    hostUid: string | undefined,
    exists: boolean,
    screen: RoomScreen,
    reaction: RoomReaction | null,
  ) => void,
): (() => void) =>
  onSnapshot(roomRef(code), (snapshot) => {
    const data = snapshot.data();
    onUpdate(
      (data?.players as RoomPlayers | undefined) ?? {},
      data?.hostUid as string | undefined,
      snapshot.exists(),
      (data?.screen as RoomScreen | undefined) ?? 'options',
      (data?.reaction as RoomReaction | undefined) ?? null,
    );
  });

/**
 * Ce dont l'hote amorce la partie : l'origine commune (ses coordonnees, le score est relatif a l'hote) et
 * tous les lieux.
 */
export type RoomGamePayload = { origin: Origin; places: Place[] };

/** Hote seul : lance la partie et envoie tous les appareils a l'ecran de jeu. */
export const startRoomGame = (code: string, payload: RoomGamePayload): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: 'game' satisfies RoomScreen,
    origin: payload.origin,
    places: payload.places,
    roundIndex: 0,
    guesses: {},
    scores: deleteField(),
    totalScores: {},
  });

/** Envoie la reponse de cet appareil ; seule ecriture d'un non-hote sur `guesses` (regles : son uid). */
export const submitRoomGuess = (code: string, uid: string, guess: Guess): Promise<void> =>
  updateDoc(roomRef(code), { [`guesses.${uid}`]: guess });

/** Hote seul : une fois toutes les reponses recues, ecrit scores et totaux puis passe au reveal. */
export const finishRoomRound = (
  code: string,
  scores: Record<string, RoundScore>,
  totalScores: Record<string, number>,
): Promise<void> => updateDoc(roomRef(code), { screen: 'reveal' satisfies RoomScreen, scores, totalScores });

/** Hote seul : manche suivante, ou fin de partie apres le dernier lieu. */
export const nextRoomRound = (code: string, roundIndex: number, placeCount: number): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: (roundIndex < placeCount ? 'game' : 'end') satisfies RoomScreen,
    roundIndex,
    guesses: {},
    scores: deleteField(),
  });

export type RoomGameState = {
  screen: RoomScreen;
  origin: Origin | null;
  places: Place[];
  roundIndex: number;
  guesses: Record<string, Guess>;
  scores: Record<string, RoundScore> | null;
  totalScores: Record<string, number>;
};

/**
 * Etat de manche en direct : l'unique abonnement de l'ecran de jeu hors joueurs et reglages. Ignore la maj
 * quand la room a disparu : sinon l'ecran "chargement" flashait avant la notice "room supprimee".
 */
export const subscribeToRoomGame = (code: string, onUpdate: (state: RoomGameState) => void): (() => void) =>
  onSnapshot(roomRef(code), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    onUpdate({
      screen: (data?.screen as RoomScreen | undefined) ?? 'options',
      origin: (data?.origin as Origin | undefined) ?? null,
      places: (data?.places as Place[] | undefined) ?? [],
      roundIndex: (data?.roundIndex as number | undefined) ?? 0,
      guesses: (data?.guesses as Record<string, Guess> | undefined) ?? {},
      scores: (data?.scores as Record<string, RoundScore> | undefined) ?? null,
      totalScores: (data?.totalScores as Record<string, number> | undefined) ?? {},
    });
  });
