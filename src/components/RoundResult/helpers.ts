/** Affiche les points d'une categorie : detail du bonus "meilleur de la manche" quand il s'applique. */
export const formatRowScore = (points: number, bonus: number): string =>
  bonus > 0 ? `+${points} + ${bonus} = ${points + bonus}` : `+${points}`;
