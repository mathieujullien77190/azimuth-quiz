import type { ContourRoundCountry } from '@/types';

import {
  QUADRANT_COUNT,
  hiddenQuadrants,
  markersInHiddenQuadrants,
  occupiedQuadrants,
  quadrantGridLines,
  quadrantRects,
  startQuadrant,
} from './quadrants';

const countryWith = (points: [number, number][]): ContourRoundCountry => ({ points }) as unknown as ContourRoundCountry;

/** A square country filling the whole board: every cell holds part of it. */
const SQUARE = countryWith([
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
]);
/** An L (latitude up, so the long arm runs along the bottom and the other up the left): nothing lies in the top-right cell. */
const L_SHAPE = countryWith([
  [0, 0],
  [10, 0],
  [10, 3],
  [3, 3],
  [3, 10],
  [0, 10],
  [0, 0],
]);
/** A triangle whose long edge crosses the right cells with no vertex in them. */
const DIAGONAL = countryWith([
  [0, 0],
  [10, 10],
  [0, 10],
  [0, 0],
]);

describe('quadrantRects', () => {
  it('cuts the board in four equal cells in reading order', () => {
    expect(quadrantRects(200, 100)).toEqual([
      { index: 0, x: 0, y: 0, width: 100, height: 50 },
      { index: 1, x: 100, y: 0, width: 100, height: 50 },
      { index: 2, x: 0, y: 50, width: 100, height: 50 },
      { index: 3, x: 100, y: 50, width: 100, height: 50 },
    ]);
  });
});

describe('occupiedQuadrants', () => {
  it('holds every cell for a country that fills the board', () => {
    expect(occupiedQuadrants(SQUARE)).toHaveLength(QUADRANT_COUNT);
  });

  it('keeps only the cells the outline goes through', () => {
    const cells = occupiedQuadrants(L_SHAPE);
    expect(cells).toEqual([0, 2, 3]);
  });

  it('marks a cell a long straight edge crosses even with no vertex in it', () => {
    expect(occupiedQuadrants(DIAGONAL)).toEqual(expect.arrayContaining([0, 2, 3]));
  });
});

describe('startQuadrant', () => {
  it('is one of the occupied cells, the same for the same seed', () => {
    const cells = occupiedQuadrants(L_SHAPE);
    for (const seed of [0, 1, 2, 3, 99, 4294967295]) {
      expect(cells).toContain(startQuadrant(L_SHAPE, seed));
      expect(startQuadrant(L_SHAPE, seed)).toBe(startQuadrant(L_SHAPE, seed));
    }
  });

  it('goes through all the occupied cells as the seed changes', () => {
    const seen = new Set([0, 1, 2, 3].map((seed) => startQuadrant(SQUARE, seed)));
    expect(seen.size).toBe(QUADRANT_COUNT);
  });
});

describe('hiddenQuadrants', () => {
  it('hides all but the starting cell, then one less per cell opened', () => {
    expect(hiddenQuadrants(1, [])).toEqual([0, 2, 3]);
    expect(hiddenQuadrants(1, [3])).toEqual([0, 2]);
    expect(hiddenQuadrants(1, [3, 0, 2])).toEqual([]);
  });
});

describe('quadrantGridLines', () => {
  it('gives the two lines through the middle of the board, edge to edge', () => {
    expect(quadrantGridLines(200, 100)).toEqual({ vertical: [100, 0, 100, 100], horizontal: [0, 50, 200, 50] });
  });
});

describe('markersInHiddenQuadrants', () => {
  const boxes = [
    { x: 10, y: 10, width: 20, height: 10 },
    { x: 150, y: 10, width: 20, height: 10 },
    { x: 10, y: 70, width: 20, height: 10 },
  ];

  it('keeps the boxes whose centre lies in a hidden cell and drops the ones in an open cell', () => {
    expect(markersInHiddenQuadrants(boxes, 200, 100, [1, 2])).toEqual([boxes[1], boxes[2]]);
    expect(markersInHiddenQuadrants(boxes, 200, 100, [])).toEqual([]);
    expect(markersInHiddenQuadrants(boxes, 200, 100, [0, 1, 2, 3])).toEqual(boxes);
  });
});
