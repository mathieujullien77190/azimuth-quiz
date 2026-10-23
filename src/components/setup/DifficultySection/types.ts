import type { Difficulty } from '@/types';

export type DifficultySectionProps = {
  /**
   * Propre au namespace de traduction de chaque jeu (`t.setup.difficultyTitle`, `t.cluesSetup.difficultyTitle`...),
   * contrairement aux libelles/emojis de difficulte (communs).
   */
  title: string;
  hint?: string;
  /** Difficulte choisie : toujours exactement une, dans chaque jeu. */
  selected: Difficulty;
  onSelect: (id: Difficulty) => void;
  disabled?: boolean;
};
