import { MAX_CONTOUR_POINTS } from '@/games/contour/constants';
import type { ContourHintCategory, ContourRoundCountry } from '@/types';

import { buildHintPlan, contourGuessPoints, normalizeHintCategories, revealedSteps, silhouetteLevel } from './hintPlan';

const places = {
  capital: { name: 'Capitale', longitude: 1, latitude: 1 },
  cities: [{ name: 'Ville', longitude: 2, latitude: 2 }],
};
const country: ContourRoundCountry = {
  code: 'AA',
  fr: 'Aa',
  en: 'Aa',
  points: [],
  neighbors: [{ type: 'country', code: 'BB', x: 0.1, y: 0.1, fr: 'Bb', en: 'Bb' }],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
  ...places,
};
const ALL: ContourHintCategory[] = ['silhouette', 'neighbors', 'cities', 'capital'];

describe('normalizeHintCategories', () => {
  it('keeps the known ids, once each, in the plan order', () => {
    expect(normalizeHintCategories(['capital', 'silhouette', 'capital', 'nope'])).toEqual(['silhouette', 'capital']);
  });

  it('means every category when nothing usable comes (old room, empty list, wrong type)', () => {
    for (const raw of [undefined, null, [], ['nope'], 'silhouette', 3]) {
      expect(normalizeHintCategories(raw)).toEqual(ALL);
    }
  });
});

describe('buildHintPlan', () => {
  it('chains the steps of every category in the fixed order, the country reveal last', () => {
    expect(buildHintPlan(ALL, country)).toEqual([
      'silhouette1',
      'silhouette2',
      'silhouette3',
      'neighborShapes',
      'neighborFlags',
      'neighborNames',
      'cityPositions',
      'cityNames',
      'capitalPosition',
      'capitalName',
      'reveal',
    ]);
  });

  it('orders by the fixed order, not by the order the categories are given in', () => {
    expect(buildHintPlan(['capital', 'silhouette'], country)).toEqual([
      'silhouette1',
      'silhouette2',
      'silhouette3',
      'capitalPosition',
      'capitalName',
      'reveal',
    ]);
  });

  it('has only the reveal step for a category with nothing to offer', () => {
    expect(buildHintPlan(['neighbors'], { ...country, neighbors: [] })).toEqual(['reveal']);
  });

  it('leaves out the city steps of a country without cities, and the capital steps of one without capital', () => {
    expect(buildHintPlan(['cities', 'capital'], { ...country, capital: null })).toEqual([
      'cityPositions',
      'cityNames',
      'reveal',
    ]);
    expect(buildHintPlan(['cities', 'capital'], { ...country, cities: [] })).toEqual([
      'capitalPosition',
      'capitalName',
      'reveal',
    ]);
  });
});

describe('revealedSteps and silhouetteLevel', () => {
  const plan = buildHintPlan(ALL, country);

  it('reveals the first steps of the plan', () => {
    expect([...revealedSteps(plan, 0)]).toEqual([]);
    expect([...revealedSteps(plan, 4)]).toEqual(['silhouette1', 'silhouette2', 'silhouette3', 'neighborShapes']);
  });

  it('starts at the coarse level and gains one per silhouette step, then stays on the full ring', () => {
    expect([0, 1, 2, 3, 4, 11].map((hints) => silhouetteLevel(plan, hints))).toEqual([0, 1, 2, 3, 3, 3]);
  });

  it('is the full ring from the start when the silhouette hints are off', () => {
    const noSilhouette = buildHintPlan(['capital'], country);
    expect(silhouetteLevel(noSilhouette, 0)).toBe(3);
  });
});

describe('contourGuessPoints', () => {
  it('goes from 500 down to 15 % of it, evenly, over the steps before the reveal', () => {
    const points = Array.from({ length: 12 }, (_, hints) => contourGuessPoints(hints, 11));
    expect(points[0]).toBe(MAX_CONTOUR_POINTS);
    expect(points[10]).toBe(Math.round(MAX_CONTOUR_POINTS * 0.15));
    expect(points[11]).toBe(0);
    for (let i = 1; i <= 10; i += 1) expect(points[i]).toBeLessThan(points[i - 1]);
  });

  it('follows the 8-step scale: 500 down to 75, then 0', () => {
    expect(Array.from({ length: 9 }, (_, hints) => contourGuessPoints(hints, 8))).toEqual([
      500, 439, 379, 318, 257, 196, 136, 75, 0,
    ]);
  });

  it('handles a plan that is only the reveal: full points, then none', () => {
    expect(contourGuessPoints(0, 1)).toBe(MAX_CONTOUR_POINTS);
    expect(contourGuessPoints(1, 1)).toBe(0);
  });

  it('is 0 without a plan', () => {
    expect(contourGuessPoints(0, 0)).toBe(0);
  });
});
