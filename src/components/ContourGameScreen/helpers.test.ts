import type { ContourCountry, ContourRoundRecord, Point2D } from '@/types';

import { boardMaxSizeFor, contourPlayerTotals, nearestUnclaimedHole, randomCountry, randomPlacesFor, rotatedOrder } from './helpers';
import { MAX_BOARD_HEIGHT_RATIO, MAX_BOARD_HEIGHT_VIEWPORT_RATIO, MAX_BOARD_WIDTH } from './constants';

describe('boardMaxSizeFor', () => {
  it('caps the width at MAX_BOARD_WIDTH on a wide, tall window', () => {
    const { maxWidth } = boardMaxSizeFor(2000, 2000);
    expect(maxWidth).toBe(MAX_BOARD_WIDTH);
  });

  it('shrinks the width to fit a narrow window', () => {
    const { maxWidth } = boardMaxSizeFor(300, 2000);
    expect(maxWidth).toBeLessThan(MAX_BOARD_WIDTH);
  });

  it('falls back to MAX_BOARD_WIDTH instead of a negative width', () => {
    const { maxWidth } = boardMaxSizeFor(0, 2000);
    expect(maxWidth).toBe(MAX_BOARD_WIDTH);
  });

  it('caps the height at a ratio of the width on a tall window', () => {
    const { maxWidth, maxHeight } = boardMaxSizeFor(2000, 2000);
    expect(maxHeight).toBeCloseTo(maxWidth * MAX_BOARD_HEIGHT_RATIO);
  });

  it('caps the height at a ratio of the window height on a short window', () => {
    const { maxHeight } = boardMaxSizeFor(2000, 200);
    expect(maxHeight).toBeCloseTo(200 * MAX_BOARD_HEIGHT_VIEWPORT_RATIO);
  });

  it('falls back to a sane height instead of 0 when the window height is 0 (e.g. first web render)', () => {
    const { maxWidth, maxHeight } = boardMaxSizeFor(2000, 0);
    expect(maxHeight).toBeCloseTo(maxWidth * MAX_BOARD_HEIGHT_RATIO);
  });
});

describe('rotatedOrder', () => {
  it('starts from player (roundIndex % playerCount)', () => {
    expect(rotatedOrder(1, 3)).toEqual([1, 2, 0]);
  });

  it('wraps the round index by the player count', () => {
    expect(rotatedOrder(4, 3)).toEqual(rotatedOrder(1, 3));
  });
});

describe('contourPlayerTotals', () => {
  const makeRecord = (totals: number[]): ContourRoundRecord => ({
    country: { code: 'FR', points: [] },
    visibleSegments: [],
    holes: [],
    boardSize: 300,
    places: [],
    holeAssignment: totals.map((_, index) => index),
    results: totals.map((total) => ({
      trace: [],
      cityGuesses: [],
      score: { traceErrorPx: 0, tracePoints: total, cityErrorPx: 0, cityPoints: 0, total },
    })),
  });

  it('sums each player\'s combined (trace + city) points across every round', () => {
    const records = [makeRecord([100, 200]), makeRecord([50, 300])];
    expect(contourPlayerTotals(records, 2)).toEqual([150, 500]);
  });

  it('returns 0 for every player when there are no records yet', () => {
    expect(contourPlayerTotals([], 3)).toEqual([0, 0, 0]);
  });
});

describe('randomCountry', () => {
  const countries: ContourCountry[] = [
    { code: 'FR', points: [] },
    { code: 'ES', points: [] },
    { code: 'IT', points: [] },
  ];

  it('excludes the given code when other countries are available', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomCountry(countries, 'FR').code).not.toBe('FR');
    }
  });

  it('falls back to the excluded code when it is the only option', () => {
    expect(randomCountry([countries[0]], 'FR').code).toBe('FR');
  });
});

describe('randomPlacesFor', () => {
  it('only returns places matching the given country code', () => {
    randomPlacesFor('FR', 5).forEach((place) => expect(place.code).toBe('FR'));
  });

  it('returns distinct places', () => {
    const places = randomPlacesFor('FR', 5);
    expect(new Set(places.map((place) => place.name)).size).toBe(places.length);
  });

  it('returns up to `count` places for every Contour country (data coverage check)', () => {
    for (const code of ['FR', 'ES', 'IT', 'PT', 'DE', 'IE', 'GR', 'NO']) {
      expect(randomPlacesFor(code, 5)).toHaveLength(5);
    }
  });

  it('returns fewer places than asked for instead of crashing when the country has less', () => {
    const places = randomPlacesFor('PT', 999);
    expect(places.length).toBeGreaterThan(0);
    expect(places.length).toBeLessThan(999);
  });

  it('returns an empty array for a country with no matching places', () => {
    expect(randomPlacesFor('XX', 3)).toEqual([]);
  });
});

describe('nearestUnclaimedHole', () => {
  const holes: Point2D[][] = [
    [{ x: 0, y: 0 }, { x: 10, y: 0 }],
    [{ x: 100, y: 100 }, { x: 110, y: 100 }],
    [{ x: 200, y: 200 }, { x: 210, y: 200 }],
  ];

  it('picks the hole whose anchors are closest to the trace\'s own endpoints', () => {
    const trace: Point2D[] = [{ x: 101, y: 101 }, { x: 105, y: 100 }, { x: 109, y: 99 }];
    expect(nearestUnclaimedHole(trace, holes, new Set())).toBe(1);
  });

  it('matches regardless of which end the player started drawing from', () => {
    const traceForward: Point2D[] = [{ x: 1, y: 1 }, { x: 9, y: 1 }];
    const traceBackward: Point2D[] = [{ x: 9, y: 1 }, { x: 1, y: 1 }];
    expect(nearestUnclaimedHole(traceForward, holes, new Set())).toBe(0);
    expect(nearestUnclaimedHole(traceBackward, holes, new Set())).toBe(0);
  });

  it('skips already-claimed holes even if they are the closest match', () => {
    const trace: Point2D[] = [{ x: 1, y: 1 }, { x: 9, y: 1 }];
    expect(nearestUnclaimedHole(trace, holes, new Set([0]))).not.toBe(0);
  });

  it('returns the only hole left regardless of exact position, once the others are claimed', () => {
    const farTrace: Point2D[] = [{ x: 500, y: 500 }, { x: 510, y: 505 }];
    expect(nearestUnclaimedHole(farTrace, holes, new Set([0, 1]))).toBe(2);
  });

  it('returns -1 when every hole is already claimed', () => {
    const trace: Point2D[] = [{ x: 1, y: 1 }, { x: 9, y: 1 }];
    expect(nearestUnclaimedHole(trace, holes, new Set([0, 1, 2]))).toBe(-1);
  });

  it('returns -1 for a degenerate trace (fewer than 2 points)', () => {
    expect(nearestUnclaimedHole([], holes, new Set())).toBe(-1);
    expect(nearestUnclaimedHole([{ x: 0, y: 0 }], holes, new Set())).toBe(-1);
  });
});
