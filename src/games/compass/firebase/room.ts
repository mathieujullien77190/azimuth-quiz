import { deleteField, onSnapshot, updateDoc } from 'firebase/firestore';

import type { GameSettings, Guess, Origin, Place, RoundScore } from '@/types';

import { createRoomApi } from '@/firebase/roomApi';

// Hors barrel : `firebase/firestore` est ESM seul et plante Jest (voir `firebase/client.ts`). Cycle de vie
// de la room partage via `createRoomApi` ; ici seulement ce que Compass joue : chacun repond seul, puis
// reveal commun.

export { ROOM_MAX_PLAYERS, type RoomPlayer, type RoomPlayers } from '@/firebase/roomApi';
export { isValidRoomCode } from '@/firebase/roomCode';

/** Ce que la room partage avec les joiners : tous les reglages sauf `playerName` (local). */
export type RoomSettings = Omit<GameSettings, 'playerName'>;

export const roomSettingsFrom = (settings: GameSettings): RoomSettings => {
  const { playerName, ...roomSettings } = settings;
  return roomSettings;
};

const rooms = createRoomApi<RoomSettings>('compass');
export const {
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
  updateRoomPlayerColors,
} = rooms;
const { roomRef } = rooms;

/** Ecran affiche par la room ; `'options'` (salon) par defaut quand le champ est absent. */
export type RoomScreen = 'options' | 'game' | 'reveal' | 'end';

/** Voir `subscribeToRoomPlayers` de `createRoomApi`, type avec les ecrans de Compass. */
export const subscribeToRoomPlayers = rooms.subscribeToRoomPlayers<RoomScreen>;

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
