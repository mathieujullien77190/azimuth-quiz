import type { ContourRoundRecord } from '@/types';

/** Each player's point total across every round, in player order. */
export const contourPlayerTotals = (records: ContourRoundRecord[], playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, playerIndex) =>
    records.reduce((total, record) => total + (record.results[playerIndex]?.score.total ?? 0), 0),
  );
