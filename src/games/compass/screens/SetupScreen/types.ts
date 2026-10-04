import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import type { Category, Difficulty, GameSettings } from '@/types';

export type SetupScreenProps = {
  onBack: () => void;
};

/** Pure rendering, no hooks with side effects (no `@/settings`, `@/games/compass/helpers/room`,
 * `@/games/compass/store/roomStore`) — every value here is already resolved, every callback already
 * decides its own business logic (e.g. the readOnly-while-joined gate) before this component
 * ever sees it. */
export type SetupScreenViewProps = {
  settings: GameSettings;
  ready: boolean;
  /** How many places the selected categories offer; `null` while the group sizes are still loading. */
  available: number | null;

  /** Solo / host / join block, shared with every other game's setup (`useSetupRoom`). */
  party: SetupPartyProps;

  readOnly: boolean;
  onToggleCategory: (id: Category) => void;
  onSelectDifficulty: (id: Difficulty) => void;
  onSelectRounds: (rounds: number) => void;
  onToggleLiveCompass: (value: boolean) => void;
  onToggleUseGps: (value: boolean) => void;
  onChangeCustomOrigin: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  onToggleShowCountry: (value: boolean) => void;
  onToggleTravel: (value: boolean) => void;

  overlayMessage: string | null;
  overlayLoading: boolean;
  onDismissOverlay: () => void;
  startDisabled: boolean;
  onStartPress: () => void;
  onBack: () => void;
};
