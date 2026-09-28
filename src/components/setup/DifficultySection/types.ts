import type { Difficulty } from '@/types';

export type DifficultySectionProps = {
  /** Differs per game's own translation namespace (`t.setup.difficultyTitle`,
   * `t.cluesSetup.difficultyTitle`...), unlike the difficulty labels/emoji below (shared). */
  title: string;
  hint?: string;
  /** The chosen difficulty — always exactly one, in every game. */
  selected: Difficulty;
  onSelect: (id: Difficulty) => void;
  disabled?: boolean;
};
