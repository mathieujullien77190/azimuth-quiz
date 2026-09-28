import type { Player, RoundRecord, RoundScore } from '@/types';

/** Who scored the most in one round on one criterion, and how much. */
export type RoundBest = { players: Player[]; points: number };

/**
 * Best player(s) of a round on `directionPoints` or `distancePoints` — everybody on the top score when
 * several tie. `null` when nobody scored on it. Only players still in the room count: online, a round
 * can hold more `results` than there are players left, and `players[index]` is then missing.
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
