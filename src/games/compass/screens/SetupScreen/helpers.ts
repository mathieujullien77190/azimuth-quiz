import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

/**
 * "Kids" category: only easy places by construction. Checking it therefore forces the
 * difficulty to Easy.
 */
export const toggleCategoryFilter = (
  settings: Pick<GameSettings, 'categories' | 'difficulty'>,
  category: Category,
): Pick<GameSettings, 'categories' | 'difficulty'> => {
  const categories = settings.categories.includes(category)
    ? settings.categories.filter((candidate) => candidate !== category)
    : [...settings.categories, category];
  const difficulty: Difficulty = category === 'kids' && categories.includes('kids') ? 'easy' : settings.difficulty;
  return { categories, difficulty };
};

/**
 * Difficulty: a single choice (radio) — clicking a chip selects it. Choosing anything other than Easy makes
 * no sense for "Kids" (designed to be easy by nature): rather than leaving it in an
 * inconsistent state, we uncheck it.
 */
export const selectDifficultyFilter = (
  settings: Pick<GameSettings, 'categories' | 'difficulty'>,
  difficulty: Difficulty,
): Pick<GameSettings, 'categories' | 'difficulty'> => {
  if (difficulty === 'easy') return { categories: settings.categories, difficulty };

  const withoutKids = settings.categories.filter((candidate) => candidate !== 'kids');
  const categories = withoutKids.length > 0 ? withoutKids : DEFAULT_SETTINGS.categories;
  return { categories, difficulty };
};
