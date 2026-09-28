import { deleteField, onSnapshot, updateDoc } from 'firebase/firestore';

import type { GameSettings, Guess, Origin, Place, RoundScore } from '@/types';

import { createRoomApi } from '@/helpers/roomBase';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note) —
// keeping this out of the barrel means only whatever actually calls into Firestore pays that
// cost, not every test that imports `@/helpers` for something unrelated.
//
// The room lifecycle (create/join/leave/colors/settings sync) is shared by every game through
// `createRoomApi`, bound here to Compass' own `rooms` collection; what's written below is only
// what Compass itself plays with: everyone answers independently, then a shared reveal.

export { ROOM_MAX_PLAYERS, type RoomPlayer, type RoomPlayers } from '@/helpers/roomBase';
export { isValidRoomCode } from '@/helpers/roomCode';

/** What a room shares with its joiners: every game setting except `playerNames`, which stays
 * local to each device/player. */
export type RoomSettings = Omit<GameSettings, 'playerNames'>;

export const roomSettingsFrom = (settings: GameSettings): RoomSettings => {
  const { playerNames, ...roomSettings } = settings;
  return roomSettings;
};

const rooms = createRoomApi<RoomSettings>('rooms');
export const {
  createRoom,
  roomExists,
  updateRoomSettings,
  subscribeToRoomSettings,
  joinRoomPresence,
  removeRoomPlayer,
  deleteRoom,
  pruneRoomPlayerData,
  sendHeartbeat,
  updateRoomPlayerColors,
} = rooms;
const { roomRef } = rooms;

/** Which screen the room is showing right now — `'options'` (the lobby/setup, the implicit
 * default while this field is absent) until the host starts the game (see `startRoomGame`). */
export type RoomScreen = 'options' | 'game' | 'reveal' | 'end';

/** See `createRoomApi`'s `subscribeToRoomPlayers`, typed with Compass' own screens. */
export const subscribeToRoomPlayers = rooms.subscribeToRoomPlayers<RoomScreen>;

/** What the host seeds the whole game with, once — the shared origin (its own GPS/custom
 * position: scoring is always relative to the host, per design) and the full list of places for
 * every round (picked once up front, same as the local solo/same-device game). */
export type RoomGamePayload = { origin: Origin; places: Place[] };

/** Host-only: starts the online game, moving every connected device to the game screen. */
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

/** Submits this device's own guess for the current round — the only write a non-host is allowed
 * on `guesses` (security rules restrict it to its own uid, same as `players`). */
export const submitRoomGuess = (code: string, uid: string, guess: Guess): Promise<void> =>
  updateDoc(roomRef(code), { [`guesses.${uid}`]: guess });

/** Host-only: once every connected player has a guess in, records this round's scores and the
 * updated running totals, and flips every device to the reveal screen. */
export const finishRoomRound = (
  code: string,
  scores: Record<string, RoundScore>,
  totalScores: Record<string, number>,
): Promise<void> => updateDoc(roomRef(code), { screen: 'reveal' satisfies RoomScreen, scores, totalScores });

/** Host-only: moves on to the next round (fresh guesses, no scores yet) or, past the last place,
 * ends the game. */
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

/** Live round state for a room — the online game screen's one subscription for everything but
 * who's connected (see `subscribeToRoomPlayers`) and the host's settings (`subscribeToRoomSettings`).
 * Skips the update once the room itself is gone (same as `subscribeToRoomSettings`) rather than
 * reporting empty/default state: without this, a deleted room briefly flashed the "loading" screen
 * (`gameState.origin` reset to `null`) in the gap before `subscribeToRoomPlayers`'s own `exists`
 * flag caught up and showed the actual "room deleted" notice. */
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
