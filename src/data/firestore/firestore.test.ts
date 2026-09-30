import { placeCategory } from '@/games/clues/helpers/clueGame';
import { contourPlacesFor } from '@/games/contour/helpers/contourPlaces';

import charadeData from '../charade.json';
import { CONTOURS } from '../contours';
import personalityJobsData from '../personalityJobs.json';
import { decodeAllPlaces } from '../places/codec';
import { decodeAllCountries } from '../places/countries';

import {
  buildCluesCounts,
  buildCompassCounts,
  buildContourCounts,
  buildContourDocsFromJson,
  buildCountryDocs,
  buildJobDocs,
  buildLegacyCountryDocs,
  buildPlaceDocs,
  buildRiddleDocs,
  flattenPoints,
  unflattenPoints,
} from './build';
import { countrySnapshot } from './denormalize';
import { isContourNumberingConsistent } from './contourDocs';
import { CLUES_NUMBERING, isNumberingConsistent } from './numbering';
import { cluesFromDoc, compassFromDoc, contourFromDoc, roundCountryFromDoc } from './read';

const places = buildPlaceDocs();
const countries = buildCountryDocs();
const contours = buildContourDocsFromJson();
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

  it('copies the country into every place, and reads it from there (no lookup)', () => {
    for (const doc of Object.values(places)) {
      expect(doc.country).toEqual(countrySnapshot(countries[doc.code]));
    }
    const paris = places.par;
    const clues = cluesFromDoc('par', { ...paris, clues: paris.clues! }, { countries: {}, jobs });
    expect(clues).toMatchObject({ country: 'France', phoneCode: '+33', currency: '€' });
  });

  it('builds country docs without silhouette, and legacy ones with it', () => {
    expect(Object.keys(countries)).toEqual(decodeAllCountries().map((country) => country.code));
    expect(Object.values(countries).some((country) => 'contour' in country)).toBe(false);
    const legacy = buildLegacyCountryDocs();
    expect(Object.keys(legacy).filter((code) => legacy[code].contour)).toEqual(CONTOURS.map((contour) => contour.code));
  });

  it('reads a round country from its document: names, capital and cities included, nothing looked up', () => {
    const doc = contours.FR;
    const round = roundCountryFromDoc('FR', doc);
    expect(round).toMatchObject({ code: 'FR', fr: doc.fr, en: doc.en, difficulty: doc.difficulty });
    expect(round.neighbors).toEqual(doc.neighbors);
    expect(round.capital).toEqual({ name: doc.capital!.name, longitude: doc.capital!.lon, latitude: doc.capital!.lat });
    expect(round.cities).toHaveLength(doc.cities!.length);
    expect(round.cities[0]).toEqual({
      name: doc.cities![0].name,
      longitude: doc.cities![0].lon,
      latitude: doc.cities![0].lat,
    });
  });

  it('reads a round country without capital nor cities as having none', () => {
    const bare = roundCountryFromDoc('XX', {
      fr: 'Xx',
      en: 'Xx',
      points: [0, 0, 1, 0, 1, 1, 0, 0],
      difficulty: 'easy',
      centerLabel: { x: 0.5, y: 0.5 },
      neighbors: [],
      borderCodes: [],
    });
    expect(bare.capital).toBeNull();
    expect(bare.cities).toEqual([]);
  });

  it('builds a contour doc per silhouette that round-trips to the board data, names copied in', () => {
    expect(Object.keys(contours).sort()).toEqual(CONTOURS.map((contour) => contour.code).sort());
    for (const contour of CONTOURS) {
      const doc = contours[contour.code];
      const restored = contourFromDoc(contour.code, doc);
      expect(restored).toMatchObject({
        code: contour.code,
        points: contour.points,
        centerLabel: contour.centerLabel,
        difficulty: contour.difficulty,
      });
      expect(doc.neighbors.map(({ type, code, x, y }) => ({ type, code, x, y }))).toEqual(contour.neighbors);
      expect(restored.neighbors).toEqual(doc.neighbors);
      expect(doc.fr).toBe(countries[contour.code].fr);
      expect(doc.borderCodes).toEqual(countries[contour.code].borders ?? []);
      for (const neighbor of doc.neighbors) {
        expect(neighbor.fr).toBe(countries[neighbor.code].fr);
        expect(neighbor.en).toBe(countries[neighbor.code].en);
      }
    }
  });

  it('precomputes the capital and cities exactly like the game did at every round', () => {
    for (const contour of CONTOURS) {
      const expected = contourPlacesFor(contour);
      const doc = contours[contour.code];
      const asDoc = (place: { name: string; longitude: number; latitude: number }) => ({
        name: place.name,
        lon: place.longitude,
        lat: place.latitude,
      });
      expect(doc.capital).toEqual(expected.capital ? asDoc(expected.capital) : undefined);
      expect(doc.cities).toEqual(expected.cities.length > 0 ? expected.cities.map(asDoc) : undefined);
    }
  });

  it('numbers the silhouettes 1..size inside their difficulty group, shuffled', () => {
    const { counts, shuffled } = buildContourCounts();
    expect(shuffled).toBe(true);
    expect(isContourNumberingConsistent(contours, counts)).toBe(true);
    expect(Object.values(counts).reduce((sum, size) => sum + size, 0)).toBe(CONTOURS.length);
    const intermediate = Object.values(contours).filter((doc) => doc.difficulty === 'intermediate');
    expect(intermediate.map((doc) => doc.n)).not.toEqual(intermediate.map((_, index) => index + 1));
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

  it('reads a Clues place from its own document alone, falling back on the lookups only for what is not migrated', () => {
    const base = { name: 'X', code: 'FR', latitude: 1, longitude: 2, difficulty: 'easy' as const };
    const clues = {
      positionInCountry: 'n' as const,
      population: 1,
      climateEmoji: '☀️',
      elevationMeters: 1,
      timezone: 'Europe/Paris',
      airportCode: 'AAA',
      emojis: ['a', 'b', 'c'],
      syllables: ['x', 'y'],
    };
    // Nothing migrated, no lookups: no riddle, category derived from the Compass one, no country details.
    expect(cluesFromDoc('xxx', { ...base, compass: { category: 'capital' }, clues })).toMatchObject({
      category: 'capital',
      riddles: [null, null],
      flagColors: [],
      currencyName: '',
    });
    // The job label comes from the vocabulary when the personality does not carry it yet; an unknown code has none.
    const lookups = { countries: {}, jobs: { emp: { fr: 'empereur', en: 'emperor' } } };
    expect(
      cluesFromDoc('xxx', { ...base, clues, personality: { name: 'P', jobCode: 'emp' } }, lookups).personality,
    ).toEqual({
      name: 'P',
      description: 'empereur',
    });
    expect(
      cluesFromDoc('xxx', { ...base, clues, personality: { name: 'P', jobCode: 'zzz' } }, lookups).personality,
    ).toEqual({
      name: 'P',
      description: null,
    });
    // What the document carries wins: its category, riddles, wordplay and job label.
    expect(
      cluesFromDoc('xxx', {
        ...base,
        clues: { ...clues, category: 'citiesFr', riddles: ['r', null] },
        wordplay: { sentence: 's', difficulty: 'hard' },
        personality: { name: 'P', jobCode: 'emp', job: { fr: 'roi', en: 'king' } },
      }),
    ).toMatchObject({
      category: 'citiesFr',
      riddles: ['r', null],
      wordplay: { sentence: 's', difficulty: 'hard' },
      personality: { name: 'P', description: 'roi' },
    });
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

  it('numbers the Clues places 1..size inside their category x difficulty group', () => {
    const { counts, shuffled } = buildCluesCounts();
    expect(shuffled).toBe(true);
    expect(isNumberingConsistent(places, counts, CLUES_NUMBERING)).toBe(true);
    const cluePlaces = Object.values(places).filter((doc) => doc.clues);
    expect(
      Object.values(counts)
        .flatMap((byDifficulty) => Object.values(byDifficulty!))
        .reduce((sum, size) => sum + size, 0),
    ).toBe(cluePlaces.length);
    for (const doc of Object.values(places)) if (!doc.clues) expect(doc.clues).toBeUndefined();
  });

  it('gives every Clues place the same category the game derives from the Compass one', () => {
    for (const [key, doc] of Object.entries(places)) {
      if (!doc.clues) continue;
      const clue = cluesFromDoc(key, { ...doc, clues: doc.clues }, { countries, jobs });
      expect(doc.clues.category).toBe(placeCategory(clue));
    }
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
    const collections = { places, countries, contours, riddles: buildRiddleDocs(), jobs };
    for (const [collection, docs] of Object.entries(collections)) {
      for (const [id, doc] of Object.entries(docs)) {
        expect(id).toMatch(/^[^/]+$/);
        expect(id).not.toMatch(/^(\.\.?|__.*)$/);
        assertFirestoreSafe(doc, `${collection}/${id}`);
      }
    }
  });
});
