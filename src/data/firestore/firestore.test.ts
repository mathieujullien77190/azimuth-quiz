import charadeData from '../charade.json';
import { CONTOURS } from '../contours';
import personalityJobsData from '../personalityJobs.json';
import { decodeAllPlaces } from '../places/codec';
import { decodeAllCountries } from '../places/countries';

import {
  buildCompassCounts,
  buildCountryDocs,
  buildJobDocs,
  buildPlaceDocs,
  buildRiddleDocs,
  flattenPoints,
  unflattenPoints,
} from './build';
import { cluesFromDoc, compassFromDoc, contourFromDoc } from './read';

const places = buildPlaceDocs();
const countries = buildCountryDocs();
const jobs = buildJobDocs();

const assertFirestoreSafe = (value: unknown, path: string): void => {
  if (value === undefined) throw new Error(`undefined at ${path}`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (Array.isArray(item)) throw new Error(`nested array at ${path}[${index}]`);
      assertFirestoreSafe(item, `${path}[${index}]`);
    });
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => assertFirestoreSafe(item, `${path}.${key}`));
  }
};

describe('firestore docs', () => {
  it('flattens and restores a ring', () => {
    const ring: [number, number][] = [
      [1, 2],
      [3, 4],
      [1, 2],
    ];
    expect(flattenPoints(ring)).toEqual([1, 2, 3, 4, 1, 2]);
    expect(unflattenPoints(flattenPoints(ring))).toEqual(ring);
  });

  it('builds one place doc per key and round-trips through the readers', () => {
    const rows = decodeAllPlaces();
    expect(Object.keys(places)).toEqual(rows.map((row) => row.key));
    for (const { key, compass, clues } of rows) {
      const doc = places[key];
      expect(doc.compass !== undefined).toBe(compass !== null);
      expect(doc.clues !== undefined).toBe(clues !== null);
      if (compass) expect(compassFromDoc({ ...doc, compass: doc.compass! })).toEqual(compass);
      if (clues) expect(cluesFromDoc(key, { ...doc, clues: doc.clues! }, { countries, jobs })).toEqual(clues);
    }
  });

  it('builds country docs that round-trip to the contours', () => {
    expect(Object.keys(countries)).toEqual(decodeAllCountries().map((country) => country.code));
    for (const contour of CONTOURS) expect(contourFromDoc(contour.code, countries[contour.code])).toEqual(contour);
    const [code, doc] = Object.entries(countries).find(([, entry]) => !entry.contour)!;
    expect(contourFromDoc(code, doc)).toBeNull();
  });

  it('applies the contour defaults for a bare silhouette', () => {
    expect(contourFromDoc('XX', { fr: 'x', en: 'x', contour: { points: [0, 0, 1, 1, 0, 0] } })).toEqual({
      code: 'XX',
      points: [
        [0, 0],
        [1, 1],
        [0, 0],
      ],
      neighbors: [],
      centerLabel: { x: 0.5, y: 0.5 },
      difficulty: 'intermediate',
    });
  });

  it('reads a place whose country is unknown and a personality without a job', () => {
    const base = { name: 'X', code: 'ZZ', latitude: 1, longitude: 2, difficulty: 'easy' as const };
    const clues = {
      positionInCountry: 'n' as const,
      population: 1,
      climateEmoji: '☀️',
      elevationMeters: 1,
      timezone: 'Europe/Paris',
      airportCode: 'AAA',
      emojis: ['a', 'b', 'c'],
      syllables: ['x'],
    };
    expect(
      cluesFromDoc('xxx', { ...base, clues, personality: { name: 'P', jobCode: null } }, { countries: {}, jobs: {} }),
    ).toMatchObject({
      country: 'ZZ',
      phoneCode: '',
      currency: '',
      personality: { name: 'P', description: null },
    });
    expect(compassFromDoc({ ...base, compass: { category: 'cities' } })).not.toHaveProperty('description');
  });

  it('numbers the Compass places 1..size inside their category x difficulty group', () => {
    const groups = new Map<string, number[]>();
    for (const doc of Object.values(places)) {
      if (!doc.compass) {
        expect(doc.n).toBeUndefined();
        continue;
      }
      const id = doc.compass.category + '|' + doc.difficulty;
      groups.set(id, [...(groups.get(id) ?? []), doc.n!]);
    }
    const { counts } = buildCompassCounts();
    for (const [id, numbers] of groups) {
      const [category, difficulty] = id.split('|');
      expect(numbers.slice().sort((a, b) => a - b)).toEqual(numbers.map((_, index) => index + 1));
      expect((counts as Record<string, Record<string, number>>)[category][difficulty]).toBe(numbers.length);
    }
    expect(
      Object.values(counts)
        .flatMap((byDifficulty) => Object.values(byDifficulty!))
        .reduce((sum, size) => sum + size, 0),
    ).toBe(Object.values(places).filter((doc) => doc.compass).length);
  });

  it('shuffles the numbering (not the import order) and marks the counts as shuffled', () => {
    expect(buildCompassCounts().shuffled).toBe(true);
    const biggest = Object.values(places)
      .filter((doc) => doc.compass?.category === 'cities' && doc.difficulty === 'hard')
      .map((doc) => doc.n!);
    // The import order would give 1, 2, 3...: the shuffled order does not.
    expect(biggest).not.toEqual(biggest.map((_, index) => index + 1));
  });

  it('mirrors the riddle and job dictionaries', () => {
    expect(Object.keys(buildRiddleDocs())).toEqual(Object.keys(charadeData));
    expect(Object.keys(jobs)).toEqual(Object.keys(personalityJobsData));
  });

  it('produces documents Firestore accepts (no undefined, no nested array, valid ids)', () => {
    const collections = { places, countries, riddles: buildRiddleDocs(), jobs };
    for (const [collection, docs] of Object.entries(collections)) {
      for (const [id, doc] of Object.entries(docs)) {
        expect(id).toMatch(/^[^/]+$/);
        expect(id).not.toMatch(/^(\.\.?|__.*)$/);
        assertFirestoreSafe(doc, `${collection}/${id}`);
      }
    }
  });
});
