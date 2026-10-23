import type { Difficulty } from '@/types';

export type DifficultySectionProps = {
  /**
   * Texte fourni par l'appelant (`t.setup.difficultyTitle`...),
   * contrairement aux libelles/emojis de difficulte (communs).
   */
  title: string;
  hint?: string;
  /** Difficulte choisie : toujours exactement une, dans chaque jeu. */
  selected: Difficulty;
  onSelect: (id: Difficulty) => void;
  disabled?: boolean;
};
