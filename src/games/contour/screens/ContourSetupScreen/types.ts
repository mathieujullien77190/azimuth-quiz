import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import type { ContourHintCategory, ContourSettings, Difficulty } from '@/types';

export type ContourSetupScreenProps = {
  onBack: () => void;
};

export type ContourSetupScreenViewProps = {
  settings: ContourSettings;

  /** Solo / host / join block, shared with every other game's setup (`useSetupRoom`). */
  party: SetupPartyProps;

  readOnly: boolean;
  onSelectDifficulty: (id: Difficulty) => void;
  onSelectRounds: (rounds: number) => void;
  onToggleHintCategory: (id: ContourHintCategory) => void;

  overlayMessage: string | null;
  overlayLoading: boolean;
  onDismissOverlay: () => void;
  onStartPress: () => void;
  onBack: () => void;
};
