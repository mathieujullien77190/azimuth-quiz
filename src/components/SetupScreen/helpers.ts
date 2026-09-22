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

export const availabilityLabel = (available: number, rounds: number): string =>
  available >= rounds
    ? `${available} lieux possibles`
    : `${available} lieux possibles : la partie sera de ${available} manches`;
