import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import type { Category, Difficulty, GameSettings } from '@/types';

export type SetupScreenProps = {
  onBack: () => void;
  /** Ouvre la preparation sur « Rejoindre » plutot que sur la partie en solo. */
  startInJoin?: boolean;
};

/**
 * Rendu pur, aucun hook a effet (pas de `@/settings`, `@/games/firebase/room`,
 * `@/store/roomStore`) : valeurs et callbacks deja resolus (ex. garde readOnly en joiner).
 */
export type SetupScreenViewProps = {
  settings: GameSettings;
  ready: boolean;
  /** Nombre de lieux offerts par les categories choisies ; `null` pendant le chargement des tailles. */
  available: number | null;

  /** Bloc solo / hote / join commun aux jeux (`useSetupRoom`). */
  party: SetupPartyProps;

  readOnly: boolean;
  onToggleCategory: (id: Category) => void;
  onSelectDifficulty: (id: Difficulty) => void;
  onSelectRounds: (rounds: number) => void;
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
