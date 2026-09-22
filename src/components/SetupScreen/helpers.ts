import type { Category } from '@/types';

/** Ajuste la liste des noms au nombre de joueurs, en gardant les noms deja saisis. */
export const resizeNames = (names: string[], count: number): string[] =>
  Array.from({ length: count }, (_, index) => names[index] ?? `Joueur ${index + 1}`);

/** Ajoute ou retire une categorie, sans jamais vider la selection. */
export const toggleCategory = (categories: Category[], category: Category): Category[] => {
  if (!categories.includes(category)) return [...categories, category];
  return categories.length > 1 ? categories.filter((candidate) => candidate !== category) : categories;
};

export const availabilityLabel = (available: number, rounds: number): string =>
  available >= rounds
    ? `${available} lieux possibles`
    : `${available} lieux possibles : la partie sera de ${available} manches`;
