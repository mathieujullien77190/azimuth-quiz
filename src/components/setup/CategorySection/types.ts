import type { Category } from '@/types';

export type CategorySectionProps = {
  /** Differs per game's own translation namespace, unlike the category labels below (shared,
   * `t.setup.categories`). */
  title: string;
  hint?: string;
  /** Which categories this game's pool actually offers — Compass' full 7, or a game-specific
   * subset (e.g. Clues' 3 city-only categories). */
  categories: { id: Category; emoji: string }[];
  selected: Category[];
  onToggle: (id: Category) => void;
  disabled?: boolean;
};
