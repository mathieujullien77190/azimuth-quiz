import { create } from 'zustand';

import {
  type RoomGameState,
  type RoomPlayers,
  type RoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from './room';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` itself: it imports
// `firebase/firestore` transitively, which crashes Jest the moment anything requires it.

const DEFAULT_GAME_STATE: RoomGameState = {
  screen: 'options',
  origin: null,
  places: [],
  roundIndex: 0,
  guesses: {},
  scores: null,
  totalScores: {},
};

/** Non-reactive: which Firestore listeners `connect` currently owns, and whether the room has
 * ever been seen to exist yet (to tell "the room was just deleted" apart from "hasn't loaded
 * yet") — module fields rather than store state, same as `gameStore`'s `startId`. */
let unsubscribers: (() => void)[] = [];
let hasSeenRoom = false;

type RoomStoreState = {
  code: string | null;
  players: RoomPlayers;
  hostUid: string | null;
  /** False once the room doc has been seen to exist and then disappeared (the host deleted it) —
   * stays true while the room has simply never loaded yet, so a screen can tell "gone" apart from
   * "still connecting". */
  roomExists: boolean;
  roomSettings: RoomSettings | null;
  gameState: RoomGameState;
  /** Not resolved here: `SetupScreen`'s own `joinRoomPresence` call already resolves this
   * device's uid (the same one `getLocalUid` would — same underlying anonymous auth session) as
   * a side effect of registering presence, and pushes it in via `setState` — no need for a second,
   * redundant resolution here for `OnlineGameScreen` to then just read back out. */
  localUid: string | null;
  /** Idempotent: a no-op if already connected to this exact code. Opens the room's three
   * Firestore subscriptions (players, settings, game) once and shares them across every screen
   * that reads this store — `SetupScreen` is the only owner of this lifecycle (see its own
   * connect/disconnect effect); `OnlineGameScreen` only ever reads. */
  connect: (code: string) => void;
  /** Tears down the three listeners and resets to defaults. */
  disconnect: () => void;
};

export const useRoomStore = create<RoomStoreState>()((set, get) => ({
  code: null,
  players: {},
  hostUid: null,
  roomExists: true,
  roomSettings: null,
  gameState: DEFAULT_GAME_STATE,
  localUid: null,

  connect: (code) => {
    if (get().code === code) return;
    get().disconnect();

    hasSeenRoom = false;
    set({ code, roomExists: true });

    unsubscribers = [
      subscribeToRoomPlayers(code, (players, hostUid, exists) => {
        if (exists) {
          hasSeenRoom = true;
        } else if (hasSeenRoom) {
          set({ roomExists: false });
          return;
        }
        set({ players, hostUid: hostUid ?? null });
      }),
      subscribeToRoomSettings(code, (roomSettings) => set({ roomSettings })),
      subscribeToRoomGame(code, (gameState) => set({ gameState })),
    ];
  },

  disconnect: () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
    set({
      code: null,
      players: {},
      hostUid: null,
      roomExists: true,
      roomSettings: null,
      gameState: DEFAULT_GAME_STATE,
      localUid: null,
    });
  },
}));
