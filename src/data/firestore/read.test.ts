import { encodeRing } from './polyline';
import {
  backdropFromDoc,
  cluesFromDoc,
  compassFromDoc,
  contourFromDoc,
  hasSilhouette,
  roundCountryFromDoc,
  type SilhouetteCountryDoc,
} from './read';
import type { PlaceDoc } from './types';

const paris: PlaceDoc = {
  name: 'Paris',
  code: 'FR',
  latitude: 48.8566,
  longitude: 2.3522,
  difficulty: 'easy',
  country: {
    fr: 'France',
    en: 'France',
    flag: [
      { id: 'blue', hex: '#0055A4', percent: 33 },
      { id: 'white', hex: '#FFFFFF', percent: 34 },
    ],
    currency: 'Euro',
    currencySymbol: '€',
    phoneCode: '+33',
  },
  compass: { category: 'capital', description: 'Ville lumière.', wikiFr: 'Paris', wikiEn: 'Paris' },
  clues: {
    positionInCountry: 'n',
    population: 2_100_000,
    climateEmoji: '⛅',
    elevationMeters: 35,
    timezone: 'Europe/Paris',
    airportCode: 'CDG',
    emojis: ['🗼', '🥐', '🎨'],
    syllables: ['pa', 'ris'],
    riddles: ['pas, sans le s'],
    category: 'capital',
  },
  personality: { name: 'Victor Hugo', jobCode: 'ecr', job: { fr: 'écrivain', en: 'writer' } },
  wordplay: { sentence: 'Un jeu de mots.', difficulty: 'intermediate' },
};

describe('compassFromDoc', () => {
  it('builds the place with the copy of its country, the description and the wiki links', () => {
    expect(compassFromDoc({ ...paris, compass: paris.compass! })).toEqual({
      name: 'Paris',
      code: 'FR',
      country: { fr: 'France', en: 'France' },
      category: 'capital',
      difficulty: 'easy',
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      description: 'Ville lumière.',
      wikiFr: 'Paris',
      wikiEn: 'Paris',
    });
  });

  it('leaves out what the document does not have', () => {
    const bare = compassFromDoc({ ...paris, country: undefined, compass: { category: 'cities' } });

    expect(bare).not.toHaveProperty('country');
    expect(bare).not.toHaveProperty('description');
    expect(bare).not.toHaveProperty('wikiFr');
    expect(bare).not.toHaveProperty('wikiEn');
  });
});

describe('cluesFromDoc', () => {
  it('builds everything a round shows from the document itself', () => {
    const place = cluesFromDoc('par', { ...paris, clues: paris.clues! });

    expect(place).toMatchObject({
      key: 'par',
      country: 'France',
      category: 'capital',
      phoneCode: '+33',
      currency: '€',
      currencyName: 'Euro',
      flagColors: [
        { id: 'blue', hex: '#0055A4', percent: 33 },
        { id: 'white', hex: '#FFFFFF', percent: 34 },
      ],
      syllables: ['pa', 'ris'],
      // A syllable without a riddle reads as null.
      riddles: ['pas, sans le s', null],
      wordplay: { sentence: 'Un jeu de mots.', difficulty: 'intermediate' },
      personality: { name: 'Victor Hugo', description: 'écrivain' },
    });
  });

  it('copes with a document that carries no copy of its country, no category and no personality job', () => {
    const place = cluesFromDoc('par', {
      ...paris,
      country: undefined,
      wordplay: undefined,
      personality: { name: 'Anonyme', jobCode: null },
      compass: { category: 'capital' },
      clues: { ...paris.clues!, category: undefined, riddles: undefined },
    });

    expect(place).toMatchObject({
      country: 'FR',
      category: 'capital',
      phoneCode: '',
      currency: '',
      currencyName: '',
      flagColors: [],
      riddles: [null, null],
      personality: { name: 'Anonyme', description: null },
    });
    expect(place).not.toHaveProperty('wordplay');
  });
});

const OUTLINE = [
  [0, 0],
  [1, 1],
  [0, 0],
] as [number, number][];

const franceDoc: SilhouetteCountryDoc = {
  ring: encodeRing(OUTLINE),
  difficulty: 'easy',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [
    {
      code: 'ES',
      fr: 'Espagne',
      en: 'Spain',
      ring: encodeRing([
        [5, 5],
        [6, 6],
        [5, 5],
      ]),
      x: 0.3,
      y: 0.9,
    },
    {
      code: 'BE',
      fr: 'Belgique',
      en: 'Belgium',
      ring: encodeRing([
        [7, 7],
        [8, 8],
        [7, 7],
      ]),
    },
    { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', x: 0.5, y: 0.1 },
  ],
  fr: 'France',
  en: 'France',
  n: 1,
  capital: { name: 'Paris', lon: 2.35, lat: 48.85 },
  cities: [{ name: 'Lyon', lon: 4.83, lat: 45.76 }],
};

describe('hasSilhouette', () => {
  it('is true for a country carrying the outline, difficulty, label anchor and neighbours', () => {
    expect(hasSilhouette(franceDoc)).toBe(true);
  });

  it('is false as soon as one of them is missing', () => {
    expect(hasSilhouette({ fr: 'Ile', en: 'Isle' })).toBe(false);
    expect(hasSilhouette({ ...franceDoc, ring: undefined })).toBe(false);
    expect(hasSilhouette({ ...franceDoc, difficulty: undefined })).toBe(false);
    expect(hasSilhouette({ ...franceDoc, centerLabel: undefined })).toBe(false);
    expect(hasSilhouette({ ...franceDoc, neighbors: undefined })).toBe(false);
  });
});

describe('contourFromDoc', () => {
  it('builds the outline the board draws, with the neighbours that are hints (those with a position)', () => {
    expect(contourFromDoc('FR', franceDoc)).toEqual({
      code: 'FR',
      points: OUTLINE,
      neighbors: [
        { type: 'country', code: 'ES', x: 0.3, y: 0.9, fr: 'Espagne', en: 'Spain' },
        { type: 'country', code: 'GB', x: 0.5, y: 0.1, fr: 'Royaume-Uni', en: 'United Kingdom' },
      ],
      centerLabel: { x: 0.5, y: 0.5 },
      difficulty: 'easy',
    });
  });
});

describe('backdropFromDoc', () => {
  it('draws the neighbours that carry an outline, whether they are a hint or not', () => {
    const backdrop = backdropFromDoc(franceDoc);

    expect(backdrop.map(({ code }) => code)).toEqual(['ES', 'BE']);
    expect(backdrop[1]).toEqual({
      code: 'BE',
      points: [
        [7, 7],
        [8, 8],
        [7, 7],
      ],
      neighbors: [],
      centerLabel: { x: 0.5, y: 0.5 },
      difficulty: 'intermediate',
    });
  });
});

describe('roundCountryFromDoc', () => {
  it('adds the names, the capital and the cities of the document', () => {
    expect(roundCountryFromDoc('FR', franceDoc)).toMatchObject({
      code: 'FR',
      fr: 'France',
      en: 'France',
      capital: { name: 'Paris', longitude: 2.35, latitude: 48.85 },
      cities: [{ name: 'Lyon', longitude: 4.83, latitude: 45.76 }],
    });
  });

  it('has no capital and no cities when the document has none', () => {
    expect(roundCountryFromDoc('FR', { ...franceDoc, capital: undefined, cities: undefined })).toMatchObject({
      capital: null,
      cities: [],
    });
  });
});
