import type { RoomPlayers, RoomReaction } from '../firebase/roomApi';

// Type-only import of `firebase/roomApi`: erased at compile time, so this folder never pulls
// `firebase/firestore` in at runtime — each game's store passes its own subscription functions in
// (`games/<game>/firebase/room.ts`), which is where the Firestore dependency actually lives (and
// what Jest mocks out).

export type RoomStoreActions = {
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
  markConnectionLost: () => void;
  /** Call right before removing this device's own presence on purpose (a joiner quitting from the
   * online game screen): otherwise that looks, from Firestore's point of view, identical to the
   * host kicking them (their uid was present, now it's not), and the setup screen's own listener
   * would show them a "you were kicked" notice for leaving by their own choice. */
  markVoluntaryLeave: () => void;
  /** Reads and clears the flag `markVoluntaryLeave` sets. */
  consumeVoluntaryLeave: () => boolean;
};

export type RoomStoreData<Settings, GameState> = {
  code: string | null;
  players: RoomPlayers;
  hostUid: string | null;
  /** False once the room doc has been seen to exist and then disappeared (the host deleted it) —
   * stays true while the room has simply never loaded yet, so a screen can tell "gone" apart from
   * "still connecting". */
  roomExists: boolean;
  roomSettings: Settings | null;
  gameState: GameState;
  /** The last emoji anyone sent to the room, or null (see `useRoomReactions`). */
  reaction: RoomReaction | null;
  /** Not resolved here: the setup screen's own `joinRoomPresence` call already resolves this
   * device's uid (the same one `getLocalUid` would — same underlying anonymous auth session) as
   * a side effect of registering presence, and pushes it in via `setState` — no need for a second,
   * redundant resolution here for the online game screen to then just read back out. */
  localUid: string | null;
  connectionLost: boolean;
};

export type RoomStoreState<Settings, GameState> = RoomStoreData<Settings, GameState> & RoomStoreActions;

export type RoomStoreConfig<Settings, GameState> = {
  defaultGameState: GameState;
  subscribeToRoomPlayers: (
    code: string,
    onUpdate: (
      players: RoomPlayers,
      hostUid: string | undefined,
      exists: boolean,
      screen?: string,
      reaction?: RoomReaction | null,
    ) => void,
  ) => () => void;
  subscribeToRoomSettings: (code: string, onSettings: (settings: Settings) => void) => () => void;
  subscribeToRoomGame: (code: string, onUpdate: (state: GameState) => void) => () => void;
};

/** What a screen needs to read from (and, for quitting, poke at) a game's room store. */
export type RoomStoreHook<Settings, GameState> = {
  <U>(selector: (state: RoomStoreState<Settings, GameState>) => U): U;
  getState: () => RoomStoreState<Settings, GameState>;
};
