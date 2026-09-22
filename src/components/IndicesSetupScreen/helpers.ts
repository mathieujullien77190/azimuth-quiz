/** Ajuste la liste des noms au nombre de joueurs, en gardant les noms deja saisis. */
export const resizeNames = (names: string[], count: number): string[] =>
  Array.from({ length: count }, (_, index) => names[index] ?? '');
