import type { Player, RoundRecord, RoundScore } from '@/types';

/** Qui a le plus marque sur un critere pendant une manche, et combien. */
export type RoundBest = { players: Player[]; points: number };

/**
 * Meilleur(s) d'une manche sur `directionPoints` ou `distancePoints`, tous les ex aequo ; `null` si
 * personne ne marque. Seuls les joueurs encore presents comptent (en ligne, `results` peut depasser
 * `players`).
 */
export const roundBest = (
  record: RoundRecord,
  players: Player[],
  criterion: keyof Pick<RoundScore, 'directionPoints' | 'distancePoints'>,
): RoundBest | null => {
  const contenders = record.results
    .map((result, index) => ({ player: players[index] as Player | undefined, points: result.score[criterion] }))
    .filter((entry): entry is { player: Player; points: number } => entry.player !== undefined);
  const points = Math.max(0, ...contenders.map((entry) => entry.points));
  if (points === 0) return null;
  return { players: contenders.filter((entry) => entry.points === points).map((entry) => entry.player), points };
};
