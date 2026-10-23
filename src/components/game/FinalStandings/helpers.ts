import type { RankedEntry, StandingEntry } from './types';

/** Meilleur total d'abord ; meme total = meme rang ("1, 1, 3"). */
export const rankEntries = (entries: StandingEntry[]): RankedEntry[] => {
  const sorted = [...entries].sort((a, b) => b.total - a.total);
  return sorted.map((entry) => ({
    ...entry,
    rank: sorted.findIndex((other) => other.total === entry.total) + 1,
  }));
};
