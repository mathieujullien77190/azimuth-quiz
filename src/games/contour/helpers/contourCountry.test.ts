import type { ContourNamedNeighbor } from '@/types';

import { neighborIcon, neighborName, normalizeContourGuess, roundCountryName } from './contourCountry';

const austria: ContourNamedNeighbor = { type: 'country', code: 'AT', x: 0, y: 0, fr: 'Autriche', en: 'Austria' };

describe('neighborIcon', () => {
  it('returns the flag emoji for a neighbor', () => {
    expect(neighborIcon(austria)).toBe('🇦🇹');
  });
});

describe('neighborName', () => {
  it('gives the names copied into the neighbor, per language', () => {
    expect(neighborName(austria, 'fr')).toBe('Autriche');
    expect(neighborName(austria, 'en')).toBe('Austria');
  });
});

describe('roundCountryName', () => {
  it('gives the country name of the round in the language asked', () => {
    const country = { fr: 'Allemagne', en: 'Germany' };
    expect(roundCountryName(country, 'fr')).toBe('Allemagne');
    expect(roundCountryName(country, 'en')).toBe('Germany');
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
