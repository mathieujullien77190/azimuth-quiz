/** Points d'une categorie, bonus "meilleur de la manche" inclus. */
export const formatRowScore = (points: number, bonus: number): string => `+${points + bonus}`;
