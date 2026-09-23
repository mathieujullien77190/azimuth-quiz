import type { RoundRecord } from '@/types';

import { playerTotals, rotatedOrder, compassSizeFor, earthSizeFor } from './helpers';
import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE } from './constants';

describe('playerTotals', () => {
  it('sums each player total across rounds, in player order', () => {
    const records = [
      { place: {} as never, results: [{ score: { total: 100 } } as never, { score: { total: 50 } } as never] },
      { place: {} as never, results: [{ score: { total: 20 } } as never, { score: { total: 80 } } as never] },
    ] as RoundRecord[];
    expect(playerTotals(records, 2)).toEqual([120, 130]);
  });

  it('returns 0 for every player when there are no records yet', () => {
    expect(playerTotals([], 3)).toEqual([0, 0, 0]);
  });
});

describe('rotatedOrder', () => {
  it('starts with the player at roundIndex, wrapping around', () => {
    expect(rotatedOrder(0, 4)).toEqual([0, 1, 2, 3]);
    expect(rotatedOrder(1, 4)).toEqual([1, 2, 3, 0]);
    expect(rotatedOrder(3, 4)).toEqual([3, 0, 1, 2]);
  });

  it('wraps roundIndex past the player count (many rounds, few players)', () => {
    expect(rotatedOrder(5, 3)).toEqual([2, 0, 1]);
  });

  it('every player starts exactly once per full cycle (fairness)', () => {
    const starters = Array.from({ length: 4 }, (_, roundIndex) => rotatedOrder(roundIndex, 4)[0]);
    expect(new Set(starters)).toEqual(new Set([0, 1, 2, 3]));
  });

  it('handles a single player', () => {
    expect(rotatedOrder(7, 1)).toEqual([0]);
  });
});

describe('compassSizeFor', () => {
  it('fits within the window width', () => {
    expect(compassSizeFor(400)).toBeLessThan(400);
  });

  it('caps at MAX_COMPASS_SIZE for a wide window', () => {
    expect(compassSizeFor(4000)).toBe(MAX_COMPASS_SIZE);
  });

  it('falls back to MAX_COMPASS_SIZE when the computed size would be <= 0', () => {
    expect(compassSizeFor(0)).toBe(MAX_COMPASS_SIZE);
  });
});

describe('earthSizeFor', () => {
  it('fits within the window width', () => {
    expect(earthSizeFor(400)).toBeLessThan(400);
  });

  it('caps at MAX_EARTH_SIZE for a wide window', () => {
    expect(earthSizeFor(4000)).toBe(MAX_EARTH_SIZE);
  });

  it('falls back to MAX_EARTH_SIZE when the computed size would be <= 0', () => {
    expect(earthSizeFor(0)).toBe(MAX_EARTH_SIZE);
  });
});
