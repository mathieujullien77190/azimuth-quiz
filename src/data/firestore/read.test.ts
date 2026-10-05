import { cluesFromDoc, compassFromDoc } from './read';
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

  it('carries the place key when it is given', () => {
    expect(compassFromDoc({ ...paris, compass: paris.compass! }, 'par')).toHaveProperty('key', 'par');
  });

  it('leaves out what the document does not have', () => {
    const bare = compassFromDoc({ ...paris, country: undefined, compass: { category: 'cities' } });

    expect(bare).not.toHaveProperty('key');
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
      clues: { ...paris.clues!, category: undefined },
    });

    expect(place).toMatchObject({
      country: 'FR',
      category: 'capital',
      phoneCode: '',
      currency: '',
      currencyName: '',
      flagColors: [],
      personality: { name: 'Anonyme', description: null },
    });
    expect(place).not.toHaveProperty('wordplay');
  });
});
