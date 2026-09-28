import type { ContourCountry } from '@/types';

import { computeBorders, splitRing } from './borders';

const country = (code: string, points: [number, number][]): ContourCountry => ({
  code,
  points,
  neighbors: [],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'intermediate',
});

// Two unit squares side by side sharing the edge x = 1, and a third one far away.
const left = country('AA', [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
]);
// Walks the shared edge in the opposite direction, like a real neighbor does.
const right = country('BB', [
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 0],
]);
const far = country('CC', [
  [50, 50],
  [51, 50],
  [51, 51],
  [50, 51],
  [50, 50],
]);
// Its bounding box meets `left`'s, but only by the corner (1, 1): no common edge.
const corner = country('DD', [
  [1, 1],
  [3, 1],
  [3, 3],
  [1, 3],
  [1, 1],
]);

describe('splitRing', () => {
  it('cuts a ring into runs of shared edges and of coast, sharing the junction points', () => {
    const runs = splitRing(left.points, new Set(['1,0|1,1']));
    // The trailing coast is glued to the leading one: the ring start is not a cut.
    expect(runs).toEqual([
      {
        shared: true,
        points: [
          [1, 0],
          [1, 1],
        ],
      },
      {
        shared: false,
        points: [
          [1, 1],
          [0, 1],
          [0, 0],
          [1, 0],
        ],
      },
    ]);
  });

  it('keeps a single run when every edge has the same nature', () => {
    expect(splitRing(left.points, new Set())).toEqual([{ shared: false, points: left.points }]);
  });

  it('does not glue the ends when the first and last runs differ', () => {
    // Only the last edge, (0,1)-(0,0), is shared.
    const runs = splitRing(left.points, new Set(['0,0|0,1']));
    expect(runs.map((run) => run.shared)).toEqual([false, true]);
  });

  it('returns nothing for a degenerate ring', () => {
    expect(splitRing([[0, 0]], new Set())).toEqual([]);
  });
});

describe('computeBorders', () => {
  it('finds the neighbors sharing an identical edge, whatever the direction it is walked in', () => {
    const borders = computeBorders(left, [left, right, far, corner]);
    expect(borders.neighborRings).toEqual([right.points]);
    expect(borders.borderRuns).toEqual([
      [
        [1, 0],
        [1, 1],
      ],
    ]);
    expect(borders.coastRuns).toEqual([
      [
        [1, 1],
        [0, 1],
        [0, 0],
        [1, 0],
      ],
    ]);
  });

  it('gives the very same segment from both sides of a border', () => {
    const fromLeft = computeBorders(left, [left, right]).borderRuns[0];
    const fromRight = computeBorders(right, [left, right]).borderRuns[0];
    expect([...fromLeft].reverse()).toEqual(fromRight);
  });

  it('ignores itself, far away countries and corner-only contacts', () => {
    const borders = computeBorders(left, [left, far, corner]);
    expect(borders.neighborRings).toEqual([]);
    expect(borders.borderRuns).toEqual([]);
    expect(borders.coastRuns).toEqual([left.points]);
  });
});
