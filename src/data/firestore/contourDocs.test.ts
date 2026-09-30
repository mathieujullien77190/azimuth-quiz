import {
  buildContourDocs,
  computeContourNumbering,
  contourPlaceDocs,
  isContourNumberingConsistent,
} from './contourDocs';
import type { ContourCountryDoc, CountryDoc, PlaceDoc } from './types';

// A 10 x 10 degree square: lon 0..10, lat 0..10.
const SQUARE = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0];

const city = (
  name: string,
  category: 'capital' | 'cities' | 'citiesFr' | 'nature',
  difficulty: PlaceDoc['difficulty'],
  lon = 5,
  lat = 5,
  code = 'AA',
): PlaceDoc => ({ name, code, latitude: lat, longitude: lon, difficulty, compass: { category } });

describe('contourPlaceDocs', () => {
  it('picks the capital and the best-known cities inside the ring, deduplicated by name', () => {
    const places = [
      city('Hard', 'cities', 'hard'),
      city('Easy', 'cities', 'easy'),
      city('Capital', 'capital', 'easy'),
      city('Capital', 'cities', 'easy'),
      city('Easy', 'citiesFr', 'intermediate'),
      city('Lake', 'nature', 'easy'),
      city('Outside', 'cities', 'easy', 50),
      city('Elsewhere', 'cities', 'easy', 5, 5, 'BB'),
      { ...city('NoCompass', 'cities', 'easy'), compass: undefined },
    ];

    expect(contourPlaceDocs('AA', SQUARE, places)).toEqual({
      capital: { name: 'Capital', lon: 5, lat: 5 },
      cities: [
        { name: 'Easy', lon: 5, lat: 5 },
        { name: 'Hard', lon: 5, lat: 5 },
      ],
    });
  });

  it('keeps at most five cities, ties in the order of the places', () => {
    const places = Array.from({ length: 8 }, (_, index) => city(`C${index}`, 'cities', 'easy'));

    expect(contourPlaceDocs('AA', SQUARE, places).cities?.map((place) => place.name)).toEqual([
      'C0',
      'C1',
      'C2',
      'C3',
      'C4',
    ]);
  });

  it('offers nothing for a country without any place inside its ring', () => {
    expect(contourPlaceDocs('AA', SQUARE, [city('Out', 'capital', 'easy', 99)])).toEqual({});
  });
});

const contourDoc = (difficulty: ContourCountryDoc['difficulty'], n?: number): ContourCountryDoc => ({
  fr: 'x',
  en: 'x',
  points: SQUARE,
  difficulty,
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [],
  borderCodes: [],
  ...(n !== undefined && { n }),
});

describe('computeContourNumbering', () => {
  it('numbers each difficulty group 1..size in the shuffled order and counts it', () => {
    const { numbers, counts } = computeContourNumbering([
      ['a', contourDoc('easy')],
      ['b', contourDoc('easy')],
      ['c', contourDoc('hard')],
    ]);

    expect([numbers.a, numbers.b].sort()).toEqual([1, 2]);
    expect(numbers.c).toBe(1);
    expect(counts).toEqual({ easy: 2, hard: 1 });
  });

  it('keeps a dense group unless forced, and renumbers one with holes', () => {
    const entries: [string, ContourCountryDoc][] = Array.from({ length: 30 }, (_, index) => [
      `p${index}`,
      contourDoc('easy', index + 1),
    ]);

    expect(computeContourNumbering(entries).numbers.p7).toBe(8);
    expect(computeContourNumbering(entries, { force: true }).numbers).not.toEqual(
      computeContourNumbering(entries).numbers,
    );
    expect(computeContourNumbering([['a', contourDoc('easy', 4)]]).numbers.a).toBe(1);
  });
});

describe('isContourNumberingConsistent', () => {
  it('accepts a dense numbering with matching counts and rejects anything else', () => {
    const contours = { a: contourDoc('easy', 1), b: contourDoc('easy', 2) };

    expect(isContourNumberingConsistent(contours, { easy: 2 })).toBe(true);
    expect(isContourNumberingConsistent(contours, undefined)).toBe(false);
    expect(isContourNumberingConsistent(contours, { easy: 3 })).toBe(false);
    expect(isContourNumberingConsistent({ a: contourDoc('easy'), b: contourDoc('easy', 2) }, { easy: 2 })).toBe(false);
  });
});

describe('buildContourDocs', () => {
  const countries: Record<string, CountryDoc> = {
    AA: {
      fr: 'Aa',
      en: 'Aaland',
      borders: ['BB'],
      contour: {
        points: SQUARE,
        neighbors: [{ type: 'country', code: 'BB', x: 0.1, y: 0.2 }],
        centerLabel: { x: 0.3, y: 0.4 },
        difficulty: 'hard',
      },
    },
    BB: {
      fr: 'Bb',
      en: 'Bbland',
      contour: { points: SQUARE, neighbors: [{ type: 'country', code: 'ZZ', x: 0, y: 0 }] },
    },
    CC: { fr: 'Cc', en: 'Cc' },
  };

  it('builds a document per silhouette with names copied in, defaults and its capital', () => {
    const { docs, counts } = buildContourDocs(countries, [city('Cap', 'capital', 'easy')]);

    expect(Object.keys(docs)).toEqual(['AA', 'BB']);
    expect(docs.AA).toMatchObject({
      fr: 'Aa',
      en: 'Aaland',
      difficulty: 'hard',
      centerLabel: { x: 0.3, y: 0.4 },
      borderCodes: ['BB'],
      capital: { name: 'Cap', lon: 5, lat: 5 },
      neighbors: [{ type: 'country', code: 'BB', x: 0.1, y: 0.2, fr: 'Bb', en: 'Bbland' }],
      n: 1,
    });
    // Defaults for a bare silhouette, and a neighbor without document keeps its code as its name.
    expect(docs.BB).toMatchObject({
      difficulty: 'intermediate',
      centerLabel: { x: 0.5, y: 0.5 },
      borderCodes: [],
      n: 1,
      neighbors: [{ code: 'ZZ', fr: 'ZZ', en: 'ZZ' }],
    });
    expect(counts).toEqual({ intermediate: 1, hard: 1 });
  });

  it('gives a silhouette without neighbors an empty list', () => {
    const { docs } = buildContourDocs({ AA: { fr: 'a', en: 'a', contour: { points: SQUARE } } }, []);

    expect(docs.AA.neighbors).toEqual([]);
  });
});
