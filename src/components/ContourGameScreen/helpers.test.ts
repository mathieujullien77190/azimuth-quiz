import { PLACES } from '@/constants';
import type { ContourCountry, ContourNeighbor, ContourRoundRecord, Place } from '@/types';

import {
  contourPlayerTotals,
  neighborIcon,
  neighborName,
  normalizeContourGuess,
  placeEmoji,
  randomCountry,
  randomPlacesFor,
  rotatedOrder,
} from './helpers';

describe('rotatedOrder', () => {
  it('starts from player (roundIndex % playerCount)', () => {
    expect(rotatedOrder(1, 3)).toEqual([1, 2, 0]);
  });

  it('wraps the round index by the player count', () => {
    expect(rotatedOrder(4, 3)).toEqual(rotatedOrder(1, 3));
  });
});

const NO_CENTER_LABEL = { x: 0.5, y: 0.5 };

describe('contourPlayerTotals', () => {
  const makeRecord = (totals: number[]): ContourRoundRecord => ({
    country: { code: 'FR', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'easy' },
    outline: [],
    width: 300,
    height: 300,
    boardSize: 300,
    places: [],
    guesserIndex: 0,
    results: totals.map((total) => ({
      cityGuesses: [],
      score: { hintsUsed: 0, guessPoints: total, penaltyPoints: 0, cityErrorPx: 0, cityPoints: 0, total },
    })),
  });

  it('sums each player\'s combined (guess + city) points across every round', () => {
    const records = [makeRecord([100, 200]), makeRecord([50, 300])];
    expect(contourPlayerTotals(records, 2)).toEqual([150, 500]);
  });

  it('returns 0 for every player when there are no records yet', () => {
    expect(contourPlayerTotals([], 3)).toEqual([0, 0, 0]);
  });
});

describe('randomCountry', () => {
  const countries: ContourCountry[] = [
    { code: 'FR', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'intermediate' },
    { code: 'ES', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'intermediate' },
    { code: 'IT', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'intermediate' },
    { code: 'NO', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'hard' },
  ];

  it('excludes the given code when other countries at the same difficulty are available', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomCountry(countries, 'intermediate', 'FR').code).not.toBe('FR');
    }
  });

  it('falls back to the excluded code when it is the only option at that difficulty', () => {
    expect(randomCountry(countries, 'hard', 'NO').code).toBe('NO');
  });

  it('only ever draws from the requested difficulty tier', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomCountry(countries, 'hard').code).toBe('NO');
    }
  });
});

describe('randomPlacesFor', () => {
  it('only returns places matching both the given country code and difficulty', () => {
    randomPlacesFor('FR', 5, 'hard').forEach((place) => {
      expect(place.code).toBe('FR');
      expect(place.difficulty).toBe('hard');
    });
  });

  it('returns distinct places', () => {
    const places = randomPlacesFor('FR', 5, 'hard');
    expect(new Set(places.map((place) => place.name)).size).toBe(places.length);
  });

  it('returns fewer places than asked for instead of crashing when the country/difficulty pool has less', () => {
    const places = randomPlacesFor('PT', 999, 'easy');
    expect(places.length).toBeGreaterThan(0);
    expect(places.length).toBeLessThan(999);
  });

  it('returns an empty array when nothing matches the country', () => {
    expect(randomPlacesFor('XX', 3, 'easy')).toEqual([]);
  });

  it('returns an empty array when the country has no places at that difficulty', () => {
    expect(randomPlacesFor('IE', 3, 'easy')).toEqual([]);
  });

  it('never draws a "kids" category place', () => {
    for (let i = 0; i < 20; i += 1) {
      randomPlacesFor('FR', 20, 'easy').forEach((place) => expect(place.category).not.toBe('kids'));
    }
  });

  it('excludes Contour-only-excluded places (e.g. Ajaccio/Bastia) while leaving them in PLACES', () => {
    expect(PLACES.some((place) => place.name === 'Bastia')).toBe(true);
    for (let i = 0; i < 20; i += 1) {
      expect(randomPlacesFor('FR', 999, 'easy').map((place) => place.name)).not.toContain('Bastia');
    }
  });
});

describe('neighborIcon', () => {
  it('returns the flag emoji for a country neighbor', () => {
    const neighbor: ContourNeighbor = { type: 'country', code: 'AT', x: 0, y: 0 };
    expect(neighborIcon(neighbor)).toBe('🇦🇹');
  });

  it('returns a fish for a sea neighbor', () => {
    const neighbor: ContourNeighbor = { type: 'sea', kind: 'sea', fr: 'Méditerranée', en: 'Mediterranean', x: 0, y: 0 };
    expect(neighborIcon(neighbor)).toBe('🐟');
  });

  it('returns a whale for an ocean neighbor', () => {
    const neighbor: ContourNeighbor = { type: 'sea', kind: 'ocean', fr: 'Atlantique', en: 'Atlantic', x: 0, y: 0 };
    expect(neighborIcon(neighbor)).toBe('🐳');
  });
});

describe('neighborName', () => {
  it('resolves a country neighbor via the shared country-name table, per language', () => {
    const neighbor: ContourNeighbor = { type: 'country', code: 'AT', x: 0, y: 0 };
    expect(neighborName(neighbor, 'fr')).toBe('Autriche');
    expect(neighborName(neighbor, 'en')).toBe('Austria');
  });

  it("uses a sea/ocean neighbor's own stored fr/en pair", () => {
    const neighbor: ContourNeighbor = { type: 'sea', kind: 'sea', fr: 'Méditerranée', en: 'Mediterranean', x: 0, y: 0 };
    expect(neighborName(neighbor, 'fr')).toBe('Méditerranée');
    expect(neighborName(neighbor, 'en')).toBe('Mediterranean');
  });
});

describe('placeEmoji', () => {
  const at = (category: Place['category']): Place =>
    ({ name: 'x', code: 'FR', category, difficulty: 'easy', coordinates: { latitude: 0, longitude: 0 } }) as Place;

  it('returns the category emoji for capital/mountains/landmarks/nature', () => {
    expect(placeEmoji(at('capital'))).toBe('⭐');
    expect(placeEmoji(at('mountains'))).toBe('⛰️');
    expect(placeEmoji(at('landmarks'))).toBe('🏛️');
    expect(placeEmoji(at('nature'))).toBe('🌿');
  });

  it('returns undefined for cities/citiesFr (plain truth dot instead)', () => {
    expect(placeEmoji(at('cities'))).toBeUndefined();
    expect(placeEmoji(at('citiesFr'))).toBeUndefined();
  });
});

describe('normalizeContourGuess', () => {
  it('lowercases the value', () => {
    expect(normalizeContourGuess('FRANCE')).toBe('france');
  });

  it('strips accents', () => {
    expect(normalizeContourGuess('Grèce')).toBe('grece');
  });

  it('drops spaces and punctuation entirely, not just collapses them', () => {
    expect(normalizeContourGuess("  Côte d'Ivoire! ")).toBe('cotedivoire');
  });

  it('treats equivalent spellings as equal', () => {
    expect(normalizeContourGuess('Royaume-Uni')).toBe(normalizeContourGuess('  royaume   UNI  '));
  });

  it('treats an apostrophe, a space, and no separator at all as equal', () => {
    const withApostrophe = normalizeContourGuess("Timor-Leste");
    expect(normalizeContourGuess('Timor Leste')).toBe(withApostrophe);
    expect(normalizeContourGuess('TimorLeste')).toBe(withApostrophe);
  });
});
