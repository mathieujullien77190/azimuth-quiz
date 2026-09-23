/** Points d'une categorie, bonus "meilleur de la manche" deja inclus (pas de detail du calcul). */
export const formatRowScore = (points: number, bonus: number): string => `+${points + bonus}`;
