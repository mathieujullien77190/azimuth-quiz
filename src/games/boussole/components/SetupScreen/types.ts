import type { RoomPlayers } from '@/games/boussole/helpers/room';
import type { Category, Difficulty, GameSettings } from '@/types';

export type SetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

// A type-only import from `room.ts` is erased at compile time, so it never actually pulls in
// `firebase/firestore` at runtime — safe for `SetupScreenView` (the dumb component) to use for
// this shape alone, unlike importing any of `room.ts`'s actual values/functions.
export type SetupScreenPlayer = RoomPlayers[string];

/** Pure rendering, no hooks with side effects (no `@/settings`, `@/games/boussole/helpers/room`,
 * `@/games/boussole/store/roomStore`) — every value here is already resolved, every callback already
 * decides its own business logic (e.g. the readOnly-while-joined gate) before this component
 * ever sees it. */
export type SetupScreenViewProps = {
  settings: GameSettings;
  ready: boolean;
  available: number;

  soloName: string;
  soloPlaceholder: string;
  soloColor: string;
  nameEditable: boolean;
  onChangeName: (text: string) => void;
  connectedPlayers: [string, SetupScreenPlayer][];
  localUid: string | null;
  hostUid: string | null;
  isHost: boolean;
  onKick: (uid: string) => void;

  onlineChoice: 'host' | 'join' | null;
  onChooseSolo: () => void;
  onChooseHost: () => void;
  onChooseJoin: () => void;
  roomCode: string | null;
  joinCode: string;
  onJoinCodeChange: (text: string) => void;
  joinCodeIsValid: boolean;
  joinStatus: 'idle' | 'valid' | 'invalid';

  readOnly: boolean;
  onToggleCategory: (id: Category) => void;
  onSelectDifficulty: (id: Difficulty) => void;
  onSelectRounds: (rounds: number) => void;
  onSelectMode: (straightLine: boolean) => void;
  onToggleLiveCompass: (value: boolean) => void;
  onToggleUseGps: (value: boolean) => void;
  onChangeCustomOrigin: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  onToggleShowCountry: (value: boolean) => void;
  onToggleHideOtherAnswers: (value: boolean) => void;

  overlayMessage: string | null;
  startDisabled: boolean;
  onStartPress: () => void;
  onBack: () => void;
};
