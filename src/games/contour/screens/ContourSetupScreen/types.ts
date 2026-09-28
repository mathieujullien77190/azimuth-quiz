import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import type { ContourSettings, Difficulty } from '@/types';

export type ContourSetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

export type ContourSetupScreenViewProps = {
  settings: ContourSettings;

  /** Solo / host / join block, shared with every other game's setup (`useSetupRoom`). */
  party: SetupPartyProps;

  readOnly: boolean;
  onSelectDifficulty: (id: Difficulty) => void;
  onSelectRounds: (rounds: number) => void;

  overlayMessage: string | null;
  onDismissOverlay: () => void;
  onStartPress: () => void;
  onBack: () => void;
};
