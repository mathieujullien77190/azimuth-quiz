import type { ContourCountry, ContourNeighbor, ContourRoundRecord } from '@/types';

import { contourPlayerTotals, neighborIcon, neighborName, normalizeContourGuess, randomCountry } from './helpers';

const NO_CENTER_LABEL = { x: 0.5, y: 0.5 };

describe('contourPlayerTotals', () => {
  const makeRecord = (totals: number[]): ContourRoundRecord => ({
    country: { code: 'FR', points: [], neighbors: [], centerLabel: NO_CENTER_LABEL, difficulty: 'easy' },
    outline: [],
    width: 300,
    height: 300,
    guesserIndex: 0,
    results: totals.map((total) => ({
      score: { hintsUsed: 0, guessPoints: total, penaltyPoints: 0, total },
    })),
  });

  it("sums each player's points across every round", () => {
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

describe('neighborIcon', () => {
  it('returns the flag emoji for a neighbor', () => {
    const neighbor: ContourNeighbor = { type: 'country', code: 'AT', x: 0, y: 0 };
    expect(neighborIcon(neighbor)).toBe('🇦🇹');
  });
});

describe('neighborName', () => {
  it('resolves a neighbor via the shared country-name table, per language', () => {
    const neighbor: ContourNeighbor = { type: 'country', code: 'AT', x: 0, y: 0 };
    expect(neighborName(neighbor, 'fr')).toBe('Autriche');
    expect(neighborName(neighbor, 'en')).toBe('Austria');
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
    const withApostrophe = normalizeContourGuess('Timor-Leste');
    expect(normalizeContourGuess('Timor Leste')).toBe(withApostrophe);
    expect(normalizeContourGuess('TimorLeste')).toBe(withApostrophe);
  });
});
