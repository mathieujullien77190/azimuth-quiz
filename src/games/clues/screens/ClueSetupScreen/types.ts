import type { SetupPartyProps } from '@/components/setup/useSetupRoom';
import type { Category, ClueSettings, Difficulty } from '@/types';

export type ClueSetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

export type ClueSetupScreenViewProps = {
  settings: ClueSettings;
  available: number;

  /** Solo / host / join block, shared with every other game's setup (`useSetupRoom`). */
  party: SetupPartyProps;

  readOnly: boolean;
  /** `Category`, not `ClueCategory`: matches `CategorySection`'s generic `onToggle` — the
   * container narrows back to `ClueCategory` when writing to `settings.categories`, safe since
   * this view only ever passes it `CLUE_CATEGORIES`' own (already-`ClueCategory`) ids. */
  onToggleCategory: (id: Category) => void;
  onSelectDifficulty: (id: Difficulty) => void;
  onToggleStartWithFirstLetter: (value: boolean) => void;
  onSelectRounds: (rounds: number) => void;

  overlayMessage: string | null;
  onDismissOverlay: () => void;

  startDisabled: boolean;
  onStartPress: () => void;
  onBack: () => void;
};
