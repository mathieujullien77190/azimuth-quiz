import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

/** Categorie "Kids" : lieux faciles par construction, donc la cocher force la difficulte a Easy. */
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
 * Difficulte : choix unique (radio). Autre chose qu'Easy n'a pas de sens pour "Kids" : on la decoche plutot
 * que de laisser un etat incoherent.
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
