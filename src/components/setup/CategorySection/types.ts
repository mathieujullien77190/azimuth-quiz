import type { Category } from '@/types';

export type CategorySectionProps = {
  /** Propre au namespace de traduction de chaque jeu, contrairement aux libelles de categories (communs). */
  title: string;
  hint?: string;
  /** Categories que le pool du jeu propose : les 7 de Compass, ou un sous-ensemble propre a un jeu. */
  categories: { id: Category; emoji: string }[];
  selected: Category[];
  onToggle: (id: Category) => void;
  disabled?: boolean;
};
