import { create } from 'zustand';

import type { RoomPlayers } from './roomBase';

// Type-only import of `roomBase`: erased at compile time, so this file never pulls
// `firebase/firestore` in at runtime — each game's store passes its own subscription functions in
// (`games/<game>/helpers/room.ts`), which is where the Firestore dependency actually lives (and
// what Jest mocks out).

export type RoomStoreState<Settings, GameState> = {
  code: string | null;
  players: RoomPlayers;
  hostUid: string | null;
  /** False once the room doc has been seen to exist and then disappeared (the host deleted it) —
   * stays true while the room has simply never loaded yet, so a screen can tell "gone" apart from
   * "still connecting". */
  roomExists: boolean;
  roomSettings: Settings | null;
  gameState: GameState;
  /** Not resolved here: the setup screen's own `joinRoomPresence` call already resolves this
   * device's uid (the same one `getLocalUid` would — same underlying anonymous auth session) as
   * a side effect of registering presence, and pushes it in via `setState` — no need for a second,
   * redundant resolution here for the online game screen to then just read back out. */
  localUid: string | null;
  /** Idempotent: a no-op if already connected to this exact code. Opens the room's three
   * Firestore subscriptions (players, settings, game) once and shares them across every screen
   * that reads this store — the setup screen is the only owner of this lifecycle (see
   * `useSetupRoom`'s connect/disconnect effect); the online game screen only ever reads. */
  connect: (code: string) => void;
  /** Tears down the three listeners and resets to defaults. */
  disconnect: () => void;
  /** Set by `useRoomPresence` when a connection was lost — this device's own, or the host's (for a
   * joiner): the game is over for this device, screens show a notice and head home. Reset on
   * connect/disconnect. */
  connectionLost: boolean;
  markConnectionLost: () => void;
  /** Call right before removing this device's own presence on purpose (a joiner quitting from the
   * online game screen): otherwise that looks, from Firestore's point of view, identical to the
   * host kicking them (their uid was present, now it's not), and the setup screen's own listener
   * would show them a "you were kicked" notice for leaving by their own choice. */
  markVoluntaryLeave: () => void;
  /** Reads and clears the flag `markVoluntaryLeave` sets. */
  consumeVoluntaryLeave: () => boolean;
};

type RoomStoreConfig<Settings, GameState> = {
  defaultGameState: GameState;
  subscribeToRoomPlayers: (
    code: string,
    onUpdate: (players: RoomPlayers, hostUid: string | undefined, exists: boolean) => void,
  ) => () => void;
  subscribeToRoomSettings: (code: string, onSettings: (settings: Settings) => void) => () => void;
  subscribeToRoomGame: (code: string, onUpdate: (state: GameState) => void) => () => void;
};

/** One Zustand store per game's online room: the connection lifecycle, players/settings/game
 * state and the voluntary-leave flag are identical for every game, only the shape of `gameState`
 * (and the Firestore subscriptions feeding it) differs. */
export const createRoomStore = <Settings, GameState>({
  defaultGameState,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  subscribeToRoomGame,
}: RoomStoreConfig<Settings, GameState>) => {
  // Non-reactive: which Firestore listeners `connect` currently owns, and whether the room has
  // ever been seen to exist yet (to tell "the room was just deleted" apart from "hasn't loaded
  // yet") — closure fields rather than store state.
  let unsubscribers: (() => void)[] = [];
  let hasSeenRoom = false;
  let leftVoluntarily = false;

  return create<RoomStoreState<Settings, GameState>>()((set, get) => ({
    code: null,
    players: {},
    hostUid: null,
    roomExists: true,
    roomSettings: null,
    gameState: defaultGameState,
    localUid: null,
    connectionLost: false,

    connect: (code) => {
      if (get().code === code) return;
      get().disconnect();

      hasSeenRoom = false;
      leftVoluntarily = false;
      set({ code, roomExists: true, connectionLost: false });

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
        gameState: defaultGameState,
        localUid: null,
        connectionLost: false,
      });
    },

    markConnectionLost: () => set({ connectionLost: true }),

    markVoluntaryLeave: () => {
      leftVoluntarily = true;
    },

    consumeVoluntaryLeave: () => {
      const value = leftVoluntarily;
      leftVoluntarily = false;
      return value;
    },
  }));
};

/** What a screen needs to read from (and, for quitting, poke at) a game's room store. */
export type RoomStoreHook<Settings, GameState> = {
  <U>(selector: (state: RoomStoreState<Settings, GameState>) => U): U;
  getState: () => RoomStoreState<Settings, GameState>;
};
