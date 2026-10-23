import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import type { Category, ClueSettings, Difficulty } from '@/types';

export type ClueSetupScreenProps = {
  onBack: () => void;
};

export type ClueSetupScreenViewProps = {
  settings: ClueSettings;
  /** Nombre de lieux offerts par la selection, `null` tant que les tailles de groupes ne sont pas chargees. */
  available: number | null;

  /** Bloc solo / hote / invite, partage avec les autres setups (`useSetupRoom`). */
  party: SetupPartyProps;

  readOnly: boolean;
  /** `Category` et non `ClueCategory` : colle au `onToggle` generique de `CategorySection` ; le container re-restreint a `ClueCategory`. */
  onToggleCategory: (id: Category) => void;
  onSelectDifficulty: (id: Difficulty) => void;
  onToggleStartWithFirstLetter: (value: boolean) => void;
  onSelectRounds: (rounds: number) => void;

  overlayMessage: string | null;
  overlayLoading: boolean;
  onDismissOverlay: () => void;

  startDisabled: boolean;
  onStartPress: () => void;
  onBack: () => void;
};
