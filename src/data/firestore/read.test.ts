import { cluesFromDoc, compassFromDoc, contourFromDoc, roundCountryFromDoc, unflattenPoints } from './read';
import type { ContourCountryDoc, PlaceDoc } from './types';

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

describe('unflattenPoints', () => {
  it('turns a flat list back into [lon, lat] pairs', () => {
    expect(unflattenPoints([1, 2, 3, 4, 1, 2])).toEqual([
      [1, 2],
      [3, 4],
      [1, 2],
    ]);
  });
});

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

const franceDoc: ContourCountryDoc = {
  points: [0, 0, 1, 1, 0, 0],
  difficulty: 'easy',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [{ type: 'country', code: 'ES', x: 0.3, y: 0.9, fr: 'Espagne', en: 'Spain' }],
  fr: 'France',
  en: 'France',
  borderCodes: ['ES'],
  n: 1,
  capital: { name: 'Paris', lon: 2.35, lat: 48.85 },
  cities: [{ name: 'Lyon', lon: 4.83, lat: 45.76 }],
};

describe('contourFromDoc', () => {
  it('builds the outline the board draws', () => {
    expect(contourFromDoc('FR', franceDoc)).toEqual({
      code: 'FR',
      points: [
        [0, 0],
        [1, 1],
        [0, 0],
      ],
      neighbors: franceDoc.neighbors,
      centerLabel: { x: 0.5, y: 0.5 },
      difficulty: 'easy',
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
