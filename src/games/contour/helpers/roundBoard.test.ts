import { CONTOURS } from '@/data';
import { flagEmoji } from '@/data/places/countries';
import type { ContourCountry } from '@/types';

import { computeBorders } from './borders';
import { boardShapeFor, buildHintLabels, precisionLevel, projectRound, roundGeometry } from './roundBoard';
import { simplificationLevels } from './simplify';

// A 2:1 rectangle at the equator, so `boardDimensionsFor` keeps a predictable aspect ratio.
const country: ContourCountry = {
  code: 'FR',
  points: [
    [0, 0],
    [2, 0],
    [2, 1],
    [0, 1],
  ],
  neighbors: [
    { type: 'country', code: 'ES', x: 0.25, y: 0.75 },
    { type: 'country', code: 'DE', x: 0.5, y: 0.25 },
  ],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
};

describe('projectRound', () => {
  it('fits the board to the box while keeping the country aspect ratio', () => {
    const board = projectRound(country, 400, 400);
    expect(board.width).toBeCloseTo(400);
    expect(board.height).toBeCloseTo(200, 0);
    expect(board.country).toBe(country);
  });

  it('shrinks the width when the height is the limiting side', () => {
    const board = projectRound(country, 400, 100);
    expect(board.height).toBeCloseTo(100);
    expect(board.width).toBeCloseTo(200, 0);
  });

  it('projects one outline point per country point, inside the canvas', () => {
    const board = projectRound(country, 400, 400);
    expect(board.outline).toHaveLength(country.points.length);
    for (const point of board.outline) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(board.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(board.height);
    }
  });

  it('scales the curated center and neighbor fractions to the canvas', () => {
    const board = projectRound(country, 400, 400);
    expect(board.centerPosition).toEqual({ x: board.width * 0.5, y: board.height * 0.5 });
    expect(board.neighborHints.map((hint) => hint.neighbor.code)).toEqual(['ES', 'DE']);
    expect(board.neighborHints[0].position).toEqual({ x: board.width * 0.25, y: board.height * 0.75 });
    expect(board.neighborHints[1].position).toEqual({ x: board.width * 0.5, y: board.height * 0.25 });
  });
});

describe('projectRound borders', () => {
  // Same 2x1 rectangle (closed), and a neighbor glued to its right side (x = 2).
  const closed: ContourCountry = { ...country, points: [...country.points, country.points[0]] };
  const neighbor: ContourCountry = {
    ...country,
    code: 'ES',
    points: [
      [2, 0],
      [4, 0],
      [4, 1],
      [2, 1],
      [2, 0],
    ],
    neighbors: [],
  };

  it('projects the neighbors, the coast and the borders in the same frame as the outline', () => {
    const board = projectRound(closed, 400, 400, {
      borders: computeBorders(closed, [closed, neighbor]),
      rings: simplificationLevels(closed.points, 1),
    });
    expect(board.neighborOutlines).toHaveLength(1);
    expect(board.neighborOutlines[0]).toHaveLength(neighbor.points.length);
    // The shared edge is one border segment, on the right side of the country.
    expect(board.borders).toHaveLength(1);
    const [start, end] = board.borders[0];
    expect(start.x).toBeCloseTo(end.x);
    expect(start.x).toBeGreaterThan(board.outline[0].x);
    expect(board.coastlines).toHaveLength(1);
  });

  it('derives the borders from the whole dataset by default (nothing touches a lonely rectangle)', () => {
    const board = projectRound(closed, 400, 400);
    expect(board.neighborOutlines).toEqual([]);
    expect(board.borders).toEqual([]);
    expect(board.coastlines).toHaveLength(1);
  });
});

describe('buildHintLabels', () => {
  const board = projectRound(country, 400, 400);
  const gap = Math.min(board.width, board.height) * 0.045;

  it('shows no label while the hints only make the outline more precise (tiers 0 to 3)', () => {
    for (const tier of [0, 1, 2, 3]) expect(buildHintLabels(board, tier, 'fr')).toEqual([]);
  });

  it('tier 4: only the neighbors flags', () => {
    const labels = buildHintLabels(board, 4, 'fr');
    expect(labels).toEqual([
      { position: board.neighborHints[0].position, icon: true, text: flagEmoji('ES') },
      { position: board.neighborHints[1].position, icon: true, text: flagEmoji('DE') },
    ]);
  });

  it('tier 5: adds the target flag at its curated spot', () => {
    const labels = buildHintLabels(board, 5, 'fr');
    expect(labels).toHaveLength(3);
    expect(labels[2]).toEqual({ position: board.centerPosition, icon: true, text: flagEmoji('FR') });
  });

  it('tier 6: stacks each neighbor name under its flag, in the requested language', () => {
    const fr = buildHintLabels(board, 6, 'fr');
    expect(fr).toHaveLength(5);
    const espagne = fr.find((label) => label.text === 'Espagne');
    expect(espagne?.position).toEqual({
      x: board.neighborHints[0].position.x,
      y: board.neighborHints[0].position.y + gap,
    });
    expect(buildHintLabels(board, 6, 'en').some((label) => label.text === 'Spain')).toBe(true);
  });

  it('tier 7: adds the target country name under its flag', () => {
    const labels = buildHintLabels(board, 7, 'fr');
    expect(labels).toHaveLength(6);
    expect(labels[5]).toEqual({
      position: { x: board.centerPosition.x, y: board.centerPosition.y + gap },
      text: 'France',
    });
  });
});

describe('the precision levels of a round', () => {
  const france = CONTOURS.find((candidate) => candidate.code === 'FR')!;
  const board = projectRound(france, 400, 400, roundGeometry(france, 7));

  it('projects the four levels in the frame of the full ring, the last one being the outline', () => {
    expect(board.precisionOutlines).toHaveLength(4);
    expect(board.precisionOutlines[3]).toEqual(board.outline);
    const counts = board.precisionOutlines.map((ring) => ring.length);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts[0]).toBeLessThan(counts[3]);
    // A coarse vertex is one of the outline points: nothing moves when the outline gets precise.
    for (const point of board.precisionOutlines[0]) expect(board.outline).toContainEqual(point);
  });

  it('is the same for the same seed and different for another one', () => {
    const same = projectRound(france, 400, 400, roundGeometry(france, 7));
    const other = projectRound(france, 400, 400, roundGeometry(france, 8));
    expect(same.precisionOutlines[0]).toEqual(board.precisionOutlines[0]);
    expect(other.precisionOutlines[0]).not.toEqual(board.precisionOutlines[0]);
  });

  it('maps hints to a level: the first three refine the outline, the rest keep the full ring', () => {
    expect([0, 1, 2, 3, 4, 7].map(precisionLevel)).toEqual([0, 1, 2, 3, 3, 3]);
  });

  it('draws only the simplified outline, single-stroked and without neighbors, below the full ring', () => {
    for (const level of [0, 1, 2]) {
      expect(boardShapeFor(board, level)).toEqual({ outline: board.precisionOutlines[level] });
    }
  });

  it('draws the neighbors and the coast/border split once the outline is the full ring', () => {
    const shape = boardShapeFor(board, 3);
    expect(shape.outline).toBe(board.outline);
    expect(shape).toMatchObject({
      neighborOutlines: board.neighborOutlines,
      coastlines: board.coastlines,
      borders: board.borders,
    });
    expect(board.neighborOutlines.length).toBeGreaterThan(0);
  });
});
