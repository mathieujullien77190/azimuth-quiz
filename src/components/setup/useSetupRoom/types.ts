import type { PartySectionProps } from '@/components/setup/PartySection';
import type { RoomPlayers } from '@/helpers/roomBase';

/** The slice of a game's own room store (`useRoomStore`/`useClueRoomStore`) the setup flow needs —
 * both stores expose these fields, only their `gameState` shape differs beyond `screen`. */
export type SetupRoomStoreState<R> = {
  players: RoomPlayers;
  hostUid: string | null;
  localUid: string | null;
  roomExists: boolean;
  roomSettings: R | null;
  gameState: { screen: string };
  connectionLost: boolean;
  markConnectionLost: () => void;
  connect: (code: string) => void;
  disconnect: () => void;
  consumeVoluntaryLeave: () => boolean;
};

export type SetupRoomStore<R> = {
  <U>(selector: (state: SetupRoomStoreState<R>) => U): U;
  getState: () => SetupRoomStoreState<R>;
  setState: (partial: { localUid: string | null }) => void;
  subscribe: (listener: (state: SetupRoomStoreState<R>) => void) => () => void;
};

/** Everything game-specific about "an online room" — each game has its own Firestore collection and
 * store (see `games/<game>/helpers/room.ts`), the setup flow on top of them is identical. `S` is the
 * game's full settings, `R` what the room shares with joiners (everything except `playerNames`). */
export type SetupRoomAdapter<S, R> = {
  store: SetupRoomStore<R>;
  /** Route both host and joiner are sent to once the host starts the game. */
  gamePath: '/online-game' | '/clues-online-game' | '/contour-online-game';
  colors: readonly string[];
  maxPlayers: number;
  roomSettingsFrom: (settings: S) => R;
  isValidRoomCode: (code: string) => boolean;
  createRoom: (settings: R) => Promise<string>;
  roomExists: (code: string) => Promise<boolean>;
  updateRoomSettings: (code: string, settings: R) => Promise<void>;
  joinRoomPresence: (code: string, name: string) => Promise<string>;
  removeRoomPlayer: (code: string, uid: string) => Promise<void>;
  deleteRoom: (code: string) => Promise<void>;
  sendHeartbeat: (code: string, uid: string) => Promise<void>;
  updateRoomPlayerColors: (code: string, colorByUid: Record<string, string>) => Promise<void>;
};

/** What `PartySection` needs beyond its title/hint (shared translations, read by the shell) —
 * resolved by `useSetupRoom`. */
export type SetupPartyProps = Omit<PartySectionProps, 'title' | 'hint'>;
