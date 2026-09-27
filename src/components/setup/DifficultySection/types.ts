import type { Difficulty } from '@/types';

export type DifficultySectionProps = {
  /** Differs per game's own translation namespace (`t.setup.difficultyTitle`,
   * `t.cluesSetup.difficultyTitle`...), unlike the difficulty labels/emoji below (shared). */
  title: string;
  hint?: string;
  /** One id for a single-choice game (Clues/Silhouette), several for Compass' multi-select —
   * `.includes()` reads right either way. */
  selected: Difficulty[];
  onSelect: (id: Difficulty) => void;
  disabled?: boolean;
};
