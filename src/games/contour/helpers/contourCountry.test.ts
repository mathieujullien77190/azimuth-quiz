import type { ContourCountry, ContourNeighbor } from '@/types';

import {
  neighborIcon,
  neighborName,
  normalizeContourGuess,
  pickContourRoundCodes,
  randomCountry,
} from './contourCountry';

const NO_CENTER_LABEL = { x: 0.5, y: 0.5 };

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

describe('pickContourRoundCodes', () => {
  const country = (code: string, difficulty: ContourCountry['difficulty']): ContourCountry => ({
    code,
    points: [],
    neighbors: [],
    centerLabel: NO_CENTER_LABEL,
    difficulty,
  });
  const pool = [country('AA', 'intermediate'), country('BB', 'intermediate'), country('CC', 'easy')];

  it('draws one code per round, all from the requested difficulty', () => {
    const codes = pickContourRoundCodes(pool, 'intermediate', 6);
    expect(codes).toHaveLength(6);
    codes.forEach((code) => expect(['AA', 'BB']).toContain(code));
  });

  it('never repeats the previous round when the pool has several countries', () => {
    const codes = pickContourRoundCodes(pool, 'intermediate', 20);
    codes.slice(1).forEach((code, index) => expect(code).not.toBe(codes[index]));
  });

  it('repeats the only country of a single-country pool', () => {
    expect(pickContourRoundCodes(pool, 'easy', 3)).toEqual(['CC', 'CC', 'CC']);
  });
});
