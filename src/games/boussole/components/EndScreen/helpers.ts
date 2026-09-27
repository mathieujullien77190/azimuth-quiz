import { MAX_ROUND_POINTS } from '@/constants';
import type { Translations } from '@/i18n';
import type { Player, RoundRecord } from '@/types';

import type { RankedPlayer } from './types';

export const maxTotalScore = (records: RoundRecord[]): number => records.length * MAX_ROUND_POINTS;

/** Ranking: best total first, tied players share the same rank. */
export const rankPlayers = (players: Player[], totals: number[]): RankedPlayer[] => {
  const sorted = players
    .map((player, index) => ({ player, total: totals[index] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return sorted.map((entry) => ({
    ...entry,
    rank: sorted.findIndex((other) => other.total === entry.total) + 1,
  }));
};

export const winnerTitle = (ranking: RankedPlayer[], t: Translations['endScreen']): string => {
  const winners = ranking.filter((entry) => entry.rank === 1);
  return winners.length === 1
    ? t.winner(winners[0].player.name)
    : t.tie(winners.map((entry) => entry.player.name).join(` ${t.and} `));
};

/** Best player of a round (the first one in case of a tie). */
export const roundWinnerIndex = (record: RoundRecord): number =>
  record.results.reduce(
    (best, result, index) => (result.score.total > record.results[best].score.total ? index : best),
    0,
  );
