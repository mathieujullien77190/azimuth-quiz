import { MAX_ROUND_POINTS } from '@/constants';
import type { Player, RoundRecord } from '@/types';

import type { RankedPlayer } from './types';

export const maxTotalScore = (records: RoundRecord[]): number => records.length * MAX_ROUND_POINTS;

/** Classement : meilleur total en premier, les ex aequo partagent le meme rang. */
export const rankPlayers = (players: Player[], totals: number[]): RankedPlayer[] => {
  const sorted = players
    .map((player, index) => ({ player, total: totals[index] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return sorted.map((entry) => ({
    ...entry,
    rank: sorted.findIndex((other) => other.total === entry.total) + 1,
  }));
};

export const winnerTitle = (ranking: RankedPlayer[]): string => {
  const winners = ranking.filter((entry) => entry.rank === 1);
  return winners.length === 1 ? `${winners[0].player.name} gagne !` : `Égalité : ${winners.map((entry) => entry.player.name).join(' et ')}`;
};

/** Meilleur joueur d'une manche (le premier en cas d'egalite). */
export const roundWinnerIndex = (record: RoundRecord): number =>
  record.results.reduce((best, result, index) => (result.score.total > record.results[best].score.total ? index : best), 0);
