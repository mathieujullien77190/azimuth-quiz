import { DEFAULT_SETTINGS } from '@/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

/** Ajuste la liste des noms au nombre de joueurs, en gardant les noms deja saisis. Les nouvelles
 * places restent vides : le placeholder au pif s'affiche, pas de "Joueur N" ecrit d'office. */
export const resizeNames = (names: string[], count: number): string[] =>
  Array.from({ length: count }, (_, index) => names[index] ?? '');

/** Ajoute ou retire une valeur d'une selection multiple (categories, difficultes...), sans jamais
 * la vider entierement. */
export const toggleSelected = <T>(selected: T[], value: T): T[] => {
  if (!selected.includes(value)) return [...selected, value];
  return selected.length > 1 ? selected.filter((candidate) => candidate !== value) : selected;
};

/**
 * Categorie "Enfants" : uniquement des lieux faciles par construction. La cocher force donc la
 * difficulte a Facile seul (choix unique, pas une selection multiple comme les autres categories).
 */
export const toggleCategoryFilter = (
  settings: Pick<GameSettings, 'categories' | 'difficulties'>,
  category: Category,
): Pick<GameSettings, 'categories' | 'difficulties'> => {
  const categories = toggleSelected(settings.categories, category);
  const difficulties = category === 'kids' && categories.includes('kids') ? (['easy'] as Difficulty[]) : settings.difficulties;
  return { categories, difficulties };
};

/**
 * Difficulte : choix unique (radio), pas une selection multiple — cliquer une pastille la
 * selectionne seule, jamais un toggle qui pourrait tout vider. Choisir autre chose que Facile n'a
 * pas de sens pour "Enfants" (pensee facile par nature) : plutot que de la laisser dans un etat
 * incoherent, on la decoche.
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
