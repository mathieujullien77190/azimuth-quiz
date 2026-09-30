import { CONTOURS } from '@/data';
import { flagEmoji } from '@/data/places/countries';
import type { ContourCountry, ContourRoundCountry } from '@/types';

import { computeBorders } from './borders';
import { buildHintPlan } from './hintPlan';
import { boardShapeFor, buildHintLabels, projectRound, roundGeometry } from './roundBoard';
import { simplificationLevels } from './simplify';

// A 2:1 rectangle at the equator, so `boardDimensionsFor` keeps a predictable aspect ratio.
const country: ContourRoundCountry = {
  code: 'FR',
  fr: 'France',
  en: 'France',
  capital: null,
  cities: [],
  points: [
    [0, 0],
    [2, 0],
    [2, 1],
    [0, 1],
  ],
  neighbors: [
    { type: 'country', code: 'ES', x: 0.25, y: 0.75, fr: 'Espagne', en: 'Spain' },
    { type: 'country', code: 'DE', x: 0.5, y: 0.25, fr: 'Allemagne', en: 'Germany' },
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
  const closed: ContourRoundCountry = { ...country, points: [...country.points, country.points[0]] };
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

  it('draws no neighbor without neighbor countries', () => {
    const board = projectRound(closed, 400, 400);
    expect(board.neighborOutlines).toEqual([]);
    expect(board.borders).toEqual([]);
    expect(board.coastlines).toHaveLength(1);
  });
});

const ALL = ['silhouette', 'neighbors', 'cities', 'capital'] as const;
const places = {
  capital: { name: 'Capitale', longitude: 1, latitude: 0.5 },
  cities: [
    { name: 'Ville A', longitude: 0.5, latitude: 0.25 },
    { name: 'Ville B', longitude: 1.5, latitude: 0.75 },
  ],
};
// The same country with a capital and two cities in its document.
const placed: ContourRoundCountry = { ...country, ...places };
// Steps of the full plan of `country`, by index: 1-3 silhouette, 4 shapes, 5 flags, 6 names, 7-8 cities,
// 9-10 capital, 11 reveal.
const fullPlan = buildHintPlan(ALL, placed);

describe('projectRound places', () => {
  it('projects the capital and the cities with the outline projector, inside the canvas', () => {
    const board = projectRound(placed, 400, 400);
    expect(board.cityMarks.map((mark) => mark.name)).toEqual(['Ville A', 'Ville B']);
    expect(board.capitalMark?.name).toBe('Capitale');
    // The capital sits at the middle of the 2x1 rectangle, so at the middle of the canvas.
    expect(board.capitalMark?.position.x).toBeCloseTo(board.width / 2);
    expect(board.capitalMark?.position.y).toBeCloseTo(board.height / 2);
    for (const mark of [...board.cityMarks, board.capitalMark!]) {
      expect(mark.position.x).toBeGreaterThan(0);
      expect(mark.position.x).toBeLessThan(board.width);
    }
  });

  it('has no mark for a country without a capital or cities', () => {
    const board = projectRound(country, 400, 400);
    expect(board.cityMarks).toEqual([]);
    expect(board.capitalMark).toBeNull();
  });
});

describe('buildHintLabels', () => {
  const board = projectRound(placed, 400, 400);
  const gap = Math.min(board.width, board.height) * 0.045;
  const labels = (hints: number, plan = fullPlan, language: 'fr' | 'en' = 'fr') =>
    buildHintLabels(board, plan, hints, language);

  it('shows no label while the hints only refine the outline and draw the neighbors', () => {
    for (const hints of [0, 1, 2, 3, 4]) expect(labels(hints)).toEqual([]);
  });

  it('shows the neighbors flags at their curated spots', () => {
    expect(labels(5)).toEqual([
      { position: board.neighborHints[0].position, icon: true, text: flagEmoji('ES') },
      { position: board.neighborHints[1].position, icon: true, text: flagEmoji('DE') },
    ]);
  });

  it('stacks the neighbors names under their flag, in the requested language', () => {
    const fr = labels(6);
    expect(fr).toHaveLength(4);
    const espagne = fr.find((label) => label.text === 'Espagne');
    expect(espagne?.position).toEqual({
      x: board.neighborHints[0].position.x,
      y: board.neighborHints[0].position.y + gap,
    });
    expect(labels(6, fullPlan, 'en').some((label) => label.text === 'Spain')).toBe(true);
  });

  it('puts the cities as dots, then their names under them', () => {
    const dots = labels(7).filter((label) => label.text === '●');
    expect(dots.map((label) => label.position)).toEqual(board.cityMarks.map((mark) => mark.position));
    const names = labels(8).filter((label) => label.text.startsWith('Ville'));
    expect(names).toEqual([
      { position: { x: board.cityMarks[0].position.x, y: board.cityMarks[0].position.y + gap }, text: 'Ville A' },
      { position: { x: board.cityMarks[1].position.x, y: board.cityMarks[1].position.y + gap }, text: 'Ville B' },
    ]);
    expect(labels(7).some((label) => label.text === 'Ville A')).toBe(false);
  });

  it('puts the capital as a star (an icon), then its name under it', () => {
    const star = labels(9).find((label) => label.text === '⭐');
    expect(star).toEqual({ position: board.capitalMark!.position, icon: true, text: '⭐' });
    expect(labels(9).some((label) => label.text === 'Capitale')).toBe(false);
    expect(labels(10).find((label) => label.text === 'Capitale')?.position).toEqual({
      x: board.capitalMark!.position.x,
      y: board.capitalMark!.position.y + gap,
    });
  });

  it('puts the country flag and name at its curated spot on the reveal step only', () => {
    expect(labels(10).some((label) => label.text === 'France')).toBe(false);
    const all = labels(11);
    expect(all).toContainEqual({ position: board.centerPosition, icon: true, text: flagEmoji('FR') });
    expect(all).toContainEqual({
      position: { x: board.centerPosition.x, y: board.centerPosition.y + gap },
      text: 'France',
    });
  });

  it('draws no city or capital label when the board has none', () => {
    const bare = projectRound(country, 400, 400);
    const plan = buildHintPlan(ALL, country);
    expect(buildHintLabels(bare, plan, plan.length, 'fr').map((label) => label.text)).toEqual([
      flagEmoji('ES'),
      'Espagne',
      flagEmoji('DE'),
      'Allemagne',
      flagEmoji('FR'),
      'France',
    ]);
  });

  it('only shows what a reduced plan contains', () => {
    const plan = buildHintPlan(['capital'], placed);
    expect(buildHintLabels(board, plan, 1, 'fr').map((label) => label.text)).toEqual(['⭐']);
    expect(buildHintLabels(board, plan, 3, 'fr').map((label) => label.text)).toEqual([
      '⭐',
      'Capitale',
      flagEmoji('FR'),
      'France',
    ]);
  });
});

describe('the precision levels of a round', () => {
  const contour = CONTOURS.find((candidate) => candidate.code === 'FR')!;
  const france: ContourRoundCountry = {
    ...contour,
    fr: 'France',
    en: 'France',
    neighbors: contour.neighbors.map((neighbor) => ({ ...neighbor, fr: neighbor.code, en: neighbor.code })),
    capital: { name: 'Paris', longitude: 2.35, latitude: 48.85 },
    cities: [],
  };
  const geometry = (seed: number) => roundGeometry(france, seed, CONTOURS);
  const board = projectRound(france, 400, 400, geometry(7));
  const plan = buildHintPlan(ALL, france);

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
    const same = projectRound(france, 400, 400, geometry(7));
    const other = projectRound(france, 400, 400, geometry(8));
    expect(same.precisionOutlines[0]).toEqual(board.precisionOutlines[0]);
    expect(other.precisionOutlines[0]).not.toEqual(board.precisionOutlines[0]);
  });

  it('draws only the outline at its precision level, single-stroked and without neighbors, up to the full ring', () => {
    for (const hints of [0, 1, 2]) {
      expect(boardShapeFor(board, plan, hints)).toEqual({ outline: board.precisionOutlines[hints] });
    }
    expect(boardShapeFor(board, plan, 3)).toEqual({ outline: board.outline });
  });

  it('draws the neighbors and the coast/border split from the neighborShapes step on', () => {
    const shape = boardShapeFor(board, plan, 4);
    expect(shape.outline).toBe(board.outline);
    expect(shape).toMatchObject({
      neighborOutlines: board.neighborOutlines,
      coastlines: board.coastlines,
      borders: board.borders,
    });
    expect(board.neighborOutlines.length).toBeGreaterThan(0);
  });

  it('starts on the full ring, without neighbors, when the silhouette hints are off', () => {
    const noSilhouette = buildHintPlan(['neighbors', 'capital'], france);
    expect(boardShapeFor(board, noSilhouette, 0)).toEqual({ outline: board.outline });
    expect(boardShapeFor(board, noSilhouette, 1)).toHaveProperty('neighborOutlines');
  });

  it('never draws the neighbors when the neighbor hints are off', () => {
    const onlySilhouette = buildHintPlan(['silhouette'], france);
    expect(boardShapeFor(board, onlySilhouette, onlySilhouette.length)).toEqual({ outline: board.outline });
  });
});
