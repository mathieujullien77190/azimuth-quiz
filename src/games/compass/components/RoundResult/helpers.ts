/** A category's points, "best of the round" bonus already included (no breakdown shown). */
export const formatRowScore = (points: number, bonus: number): string => `+${points + bonus}`;
