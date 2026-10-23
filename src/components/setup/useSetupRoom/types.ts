import type { PartySectionProps } from '@/components/setup/PartySection';
import type { RoomPlayers } from '@/firebase/roomApi';

/**
 * Partie du store de room d'un jeu (`useRoomStore`) dont le setup a besoin : seule la forme de `gameState`
 * compte au-dela de `screen`.
 */
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

/**
 * Tout ce qui est propre a un jeu dans « une room en ligne » : chaque jeu a sa collection Firestore et son
 * store (voir `games/<game>/firebase/room.ts`), le setup au-dessus est identique. `S` = reglages complets du
 * jeu, `R` = ce que la room partage avec les joiners (tout sauf `playerName`).
 */
export type SetupRoomAdapter<S, R> = {
  store: SetupRoomStore<R>;
  /** Route ou l'hote et les joiners sont envoyes quand l'hote lance la partie. */
  gamePath: '/online-game';
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

/**
 * Ce dont `PartySection` a besoin en plus de title/hint (traductions communes, lues par le shell), resolu par
 * `useSetupRoom`.
 */
export type SetupPartyProps = Omit<PartySectionProps, 'title' | 'hint'>;
