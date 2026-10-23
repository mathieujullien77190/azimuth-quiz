import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { REACTION_COOLDOWN_MS, REACTIONS_PER_GAME } from '@/data';
import { useRoomStore } from '@/store/roomStore';

import type { RoomPlayers, RoomReaction } from '../firebase/roomApi';
import { reporting } from './errors';
import { onlinePlayersFrom } from './roomPlayers';

/** Maps par joueur de l'etat de manche (chaque jeu en a certaines, aucun toutes). */
const PLAYER_KEYED_FIELDS = ['guesses', 'scores', 'totalScores'] as const;

/** Donnees de manche encore presentes par champ pour des joueurs partis. */
export type StaleRoomData = Record<string, string[]>;

/**
 * Hote seul : quand un joueur part, ses donnees de manche (reponse, score, total) partent avec lui ; s'il revient,
 * c'est un nouveau joueur. Attend de se connaitre dans la liste : avant, elle peut etre vide et lire "tous partis".
 */
export const useHostPruneLeavers = (
  isHost: boolean,
  localUid: string | null,
  players: RoomPlayers,
  gameState: unknown,
  prune: (stale: StaleRoomData) => Promise<void>,
) => {
  useEffect(() => {
    if (!isHost || localUid === null || !(localUid in players)) return;
    const state = gameState as Partial<Record<(typeof PLAYER_KEYED_FIELDS)[number], Record<string, unknown> | null>>;
    const stale: StaleRoomData = {};
    for (const field of PLAYER_KEYED_FIELDS) {
      const uids = Object.keys(state[field] ?? {}).filter((uid) => !(uid in players));
      if (uids.length > 0) stale[field] = uids;
    }
    if (Object.keys(stale).length === 0) return;
    prune(stale).catch(reporting('room.pruneLeavers', { kind: 'background' }));
  }, [isHost, localUid, players, gameState, prune]);
};

// Lent et peu couteux expres : chaque heartbeat est une ecriture lue par tous (N joueurs = N lectures). 30 s / seuil
// 90 s donnent ~500 ecritures et 2000 lectures pour 4 joueurs en 1 h, et rien seul ou au salon (voir `active`).
const HEARTBEAT_MS = 30_000;
const LOST_AFTER_MS = 90_000;
const CHECK_MS = 10_000;
/** Un controle en retard de cet ordre = appareil suspendu (arriere-plan, ecran verrouille), pas une coupure : reinitialiser. */
const SUSPENDED_GAP_MS = CHECK_MS * 3;

type PresenceApi = {
  sendHeartbeat: (code: string, uid: string) => Promise<void>;
  deleteRoom: (code: string) => Promise<void>;
  removeRoomPlayer: (code: string, uid: string) => Promise<void>;
};

/**
 * Detection de coupure, commune aux jeux, montee une fois par `useSetupRoom`. En partie a plusieurs, chaque appareil
 * ecrit `lastSeen` et surveille celui des autres (changement, jamais compare a l'horloge locale). Qui perd la
 * connexion quitte la partie :
 * - son propre heartbeat sans accuse trop longtemps : `connectionLost` et sortie (hote supprime la room, joiner part) ;
 * - l'hote ne voit plus un joiner : il le retire (voir `useHostPruneLeavers`) ;
 * - un joiner ne voit plus l'hote : il part (sans hote, plus de manches ni de scores).
 */
export const useRoomPresence = (api: PresenceApi, code: string | null) => {
  const localUid = useRoomStore((s) => s.localUid);
  const screen = useRoomStore((s) => s.gameState.screen);
  const playerCount = useRoomStore((s) => Object.keys(s.players).length);
  const active = code !== null && localUid !== null && screen === 'game' && playerCount > 1;

  const lastAckRef = useRef(0);
  const lastCheckRef = useRef(0);
  const seenRef = useRef(new Map<string, { value: number | null; at: number }>());

  // Seul signal "en ligne" : l'ecriture est acquittee par le serveur (un rejet, ex. room disparue, ne compte pas).
  useEffect(() => {
    if (!active || code === null || localUid === null) return;
    const beat = () =>
      api
        .sendHeartbeat(code, localUid)
        .then(() => {
          lastAckRef.current = Date.now();
        })
        .catch(reporting('room.heartbeat', { kind: 'background', room: code }));
    lastAckRef.current = Date.now();
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [active, code, localUid, api]);

  useEffect(() => {
    if (!active || code === null || localUid === null) return;
    const seen = seenRef.current;
    seen.clear();
    lastCheckRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckRef.current > SUSPENDED_GAP_MS) {
        lastCheckRef.current = now;
        lastAckRef.current = now;
        seen.clear();
        return;
      }
      lastCheckRef.current = now;

      const state = useRoomStore.getState();
      const isHost = localUid === state.hostUid;
      let hostSilent = false;
      const silentJoiners: string[] = [];
      for (const [uid, player] of Object.entries(state.players)) {
        if (uid === localUid) continue;
        const value = player.lastSeen?.toMillis() ?? null;
        const previous = seen.get(uid);
        if (!previous || previous.value !== value) {
          seen.set(uid, { value, at: now });
        } else if (now - previous.at > LOST_AFTER_MS) {
          if (uid === state.hostUid) hostSilent = true;
          else silentJoiners.push(uid);
        }
      }
      for (const uid of seen.keys()) if (!(uid in state.players)) seen.delete(uid);

      if (now - lastAckRef.current > LOST_AFTER_MS || (!isHost && hostSilent)) {
        state.markConnectionLost();
        if (isHost) api.deleteRoom(code).catch(reporting('room.deleteOnLoss', { kind: 'background', room: code }));
        else
          api.removeRoomPlayer(code, localUid).catch(reporting('room.leaveOnLoss', { kind: 'background', room: code }));
        return;
      }
      if (isHost) {
        silentJoiners.forEach((uid) => {
          seen.delete(uid);
          api.removeRoomPlayer(code, uid).catch(reporting('room.removeSilent', { kind: 'background', room: code }));
        });
      }
    }, CHECK_MS);
    return () => clearInterval(interval);
  }, [active, code, localUid, api]);
};

/** Reaction recue a afficher : l'emoji et l'expediteur dessous (null s'il est parti). */
export type ShownReaction = { emoji: string; name: string | null; seq: number };

/**
 * Reactions emoji d'une room : `reaction` = la derniere envoyee (la mienne comprise) depuis l'ouverture de l'ecran
 * (une deja presente est ignoree) ; `send` l'envoie. Delai `REACTION_COOLDOWN_MS` entre deux envois, au plus
 * `REACTIONS_PER_GAME` par partie ; `canReact` faux seul dans la room ou quota atteint.
 */
export const useRoomReactions = (
  reaction: RoomReaction | null,
  players: RoomPlayers,
  sendReaction: (code: string, emoji: string) => Promise<void>,
  code: string,
) => {
  // Celle deja presente a l'ouverture compte comme vue.
  const [seenSeq, setSeenSeq] = useState<number | null>(reaction?.seq ?? null);
  const [latest, setLatest] = useState<RoomReaction | null>(null);
  // Derive au rendu (pattern React), pas en effet : pas d'image ou la reaction existe sans etre affichee.
  if (reaction !== null && reaction.seq !== seenSeq) {
    setSeenSeq(reaction.seq);
    setLatest(reaction);
  }

  const lastSentAt = useRef(0);
  // Compte sur cet appareil pour la vie de l'ecran : une nouvelle partie le remet a zero.
  const [sent, setSent] = useState(0);
  const send = (emoji: string) => {
    const now = Date.now();
    if (sent >= REACTIONS_PER_GAME || now - lastSentAt.current < REACTION_COOLDOWN_MS) return;
    lastSentAt.current = now;
    setSent((count) => count + 1);
    sendReaction(code, emoji).catch(reporting('room.reaction', { kind: 'background', room: code }));
  };

  return {
    reaction:
      latest === null
        ? null
        : ({ emoji: latest.emoji, name: players[latest.uid]?.name ?? null, seq: latest.seq } satisfies ShownReaction),
    send,
    canReact: Object.keys(players).length > 1 && sent < REACTIONS_PER_GAME,
  };
};

/**
 * Ce dont tout ecran de jeu en ligne a besoin sur sa room : etat du store de room (connexion geree par le setup,
 * voir `useSetupRoom`), hote, joueurs en ordre d'arrivee, redirection "room supprimee", `handleQuit`.
 */
export const useOnlineRoomSession = (
  roomApi: {
    deleteRoom: (code: string) => Promise<void>;
    restartRoom: (code: string) => Promise<void>;
    sendReaction: (code: string, emoji: string) => Promise<void>;
    removeRoomPlayer: (code: string, uid: string) => Promise<void>;
    pruneRoomPlayerData: (code: string, stale: StaleRoomData) => Promise<void>;
  },
  code: string,
  onQuit: () => void,
) => {
  const router = useRouter();

  const localUid = useRoomStore((s) => s.localUid);
  const players = useRoomStore((s) => s.players);
  const hostUid = useRoomStore((s) => s.hostUid);
  const roomExists = useRoomStore((s) => s.roomExists);
  const connectionLost = useRoomStore((s) => s.connectionLost);
  // Faux une fois l'appareil sorti du store (l'hote qui quitte : voir `handleQuit`).
  const connected = useRoomStore((s) => s.code !== null);
  const roomSettings = useRoomStore((s) => s.roomSettings);
  const gameState = useRoomStore((s) => s.gameState);
  const roomReaction = useRoomStore((s) => s.reaction);

  // Room disparue (l'hote l'a supprimee) : la notice "l'hote a quitte" est geree par `useSetupRoom` ; repli
  // direct vers l'accueil, pas un simple retour (le setup montrerait la room morte).
  useEffect(() => {
    if (roomExists && !connectionLost) return;
    const timeout = setTimeout(() => router.dismissTo('/'), 2000);
    return () => clearTimeout(timeout);
  }, [roomExists, connectionLost, router]);

  // Room revenue au salon ("Rejouer", `handleReplay`) : on recule vers le setup reste monte. Jamais deconnecte :
  // l'etat reinitialise du store est aussi `'options'`, et l'hote qui quitte rentre deja seul.
  const onQuitRef = useRef(onQuit);
  useEffect(() => {
    onQuitRef.current = onQuit;
  });
  const backInLobby = connected && roomExists && gameState.screen === 'options';
  useEffect(() => {
    if (backInLobby) onQuitRef.current();
  }, [backInLobby]);

  // Emojis du footer et reaction recue (toutes, la mienne comprise) affichee sur l'ecran.
  const reactions = useRoomReactions(roomReaction, players, roomApi.sendReaction, code);

  const onlinePlayers = onlinePlayersFrom(players);
  const isHost = localUid !== null && localUid === hostUid;

  // Qui part emporte sa reponse, son score et son total (voir `useHostPruneLeavers`).
  const { pruneRoomPlayerData } = roomApi;
  const prune = useCallback((stale: StaleRoomData) => pruneRoomPlayerData(code, stale), [pruneRoomPlayerData, code]);
  useHostPruneLeavers(isHost, localUid, players, gameState, prune);

  // Hote : quitter supprime la room ; retour direct a l'accueil avec `dismissTo`, qui depile jeu ET setup (un
  // `replace` laissait l'ancien setup monte, qui reagissait a la room suivante). Deconnecte aussi le store ici : sinon
  // son `code`/`screen` perime relance l'effet "aller au jeu" vers une room inexistante. Un joiner retire
  // seulement sa presence (pour ne pas bloquer la manche) et revient au setup, la room vivant toujours.
  const handleQuit = () => {
    if (isHost) {
      roomApi.deleteRoom(code).catch(reporting('room.deleteOnQuit', { kind: 'background', room: code }));
      useRoomStore.getState().disconnect();
      router.dismissTo('/');
      return;
    }
    if (localUid !== null) {
      // Marque AVANT l'ecriture : le setup ecoute le meme update et ne distinguerait pas "j'ai quitte" de "expulse".
      useRoomStore.getState().markVoluntaryLeave();
      roomApi.removeRoomPlayer(code, localUid).catch(reporting('room.leaveOnQuit', { kind: 'background', room: code }));
    }
    onQuit();
  };

  // "Rejouer" : l'hote remet la room au salon (l'effet ci-dessus y ramene chaque appareil) ; un joiner y retourne seul.
  const handleReplay = () => {
    if (isHost) roomApi.restartRoom(code).catch(reporting('room.restart', { room: code }));
    else onQuit();
  };

  return {
    localUid,
    players,
    hostUid,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    onlinePlayers,
    isHost,
    handleQuit,
    handleReplay,
    reactions,
  };
};
