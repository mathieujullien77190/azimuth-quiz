import type { ContourRoundRecord } from '@/types';

import { contourPlayerTotals } from './helpers';

const NO_CENTER_LABEL = { x: 0.5, y: 0.5 };

describe('contourPlayerTotals', () => {
  const makeRecord = (totals: number[]): ContourRoundRecord => ({
    country: { code: 'FR', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'easy' },
    outline: [],
    width: 300,
    height: 300,
    guesserIndex: 0,
    results: totals.map((total) => ({
      score: { hintsUsed: 0, guessPoints: total, penaltyPoints: 0, total },
    })),
  });

  it("sums each player's points across every round", () => {
    const records = [makeRecord([100, 200]), makeRecord([50, 300])];
    expect(contourPlayerTotals(records, 2)).toEqual([150, 500]);
  });

  it('returns 0 for every player when there are no records yet', () => {
    expect(contourPlayerTotals([], 3)).toEqual([0, 0, 0]);
  });
});
