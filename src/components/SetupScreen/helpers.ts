import { DEFAULT_SETTINGS } from '@/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

/** Resizes the name list to the player count, keeping already-entered names. New
 * slots stay empty: the random placeholder shows, no "Player N" written by default. */
export const resizeNames = (names: string[], count: number): string[] =>
  Array.from({ length: count }, (_, index) => names[index] ?? '');

/** Adds or removes a value from a multi-select (categories, difficulties...), never
 * emptying it entirely. */
export const toggleSelected = <T>(selected: T[], value: T): T[] => {
  if (!selected.includes(value)) return [...selected, value];
  return selected.length > 1 ? selected.filter((candidate) => candidate !== value) : selected;
};

/**
 * "Kids" category: only easy places by construction. Checking it therefore forces the
 * difficulty to Easy alone (single choice, not a multi-select like the other categories).
 */
export const toggleCategoryFilter = (
  settings: Pick<GameSettings, 'categories' | 'difficulties'>,
  category: Category,
): Pick<GameSettings, 'categories' | 'difficulties'> => {
  const categories = settings.categories.includes(category)
    ? settings.categories.filter((candidate) => candidate !== category)
    : [...settings.categories, category];
  const difficulties =
    category === 'kids' && categories.includes('kids') ? (['easy'] as Difficulty[]) : settings.difficulties;
  return { categories, difficulties };
};

/**
 * Difficulty: single choice (radio), not a multi-select — clicking a chip selects it
 * alone, never a toggle that could empty everything. Choosing anything other than Easy makes
 * no sense for "Kids" (designed to be easy by nature): rather than leaving it in an
 * inconsistent state, we uncheck it.
 */
export const selectDifficultyFilter = (
  settings: Pick<GameSettings, 'categories' | 'difficulties'>,
  difficulty: Difficulty,
): Pick<GameSettings, 'categories' | 'difficulties'> => {
  if (difficulty === 'easy') return { categories: settings.categories, difficulties: [difficulty] };

  const withoutKids = settings.categories.filter((candidate) => candidate !== 'kids');
  const categories = withoutKids.length > 0 ? withoutKids : DEFAULT_SETTINGS.categories;
  return { categories, difficulties: [difficulty] };
};
