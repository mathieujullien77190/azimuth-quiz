import type { RankedEntry, StandingEntry } from './types';

/** Best total first; players on the same total share the same rank ("1, 1, 3"). */
export const rankEntries = (entries: StandingEntry[]): RankedEntry[] => {
  const sorted = [...entries].sort((a, b) => b.total - a.total);
  return sorted.map((entry) => ({
    ...entry,
    rank: sorted.findIndex((other) => other.total === entry.total) + 1,
  }));
};
