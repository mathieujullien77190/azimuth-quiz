import { PLACES } from '@/data';

import type { CountryRow } from './countries';
import countriesData from './countries.json';
import {
  countryCurrencyName,
  countryFlagColors,
  countryName,
  decodeCountry,
  FLAG_COLOR_FIELD,
  flagEmoji,
} from './countries';

describe('the countries data', () => {
  const rows = countriesData as unknown as Record<string, CountryRow>;

  it('gives both fr and en names for every entry', () => {
    for (const [code, row] of Object.entries(rows)) {
      expect(row[0].length).toBeGreaterThan(0);
      expect(row[1].length).toBeGreaterThan(0);
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('covers every country code used by PLACES', () => {
    const missing = [...new Set(PLACES.map((place) => place.code))].filter((code) => !(code in rows));
    expect(missing).toEqual([]);
  });
});

describe('countryName', () => {
  it('returns the name in the requested language', () => {
    expect(countryName('FR', 'fr')).toBe('France');
    expect(countryName('FR', 'en')).toBe('France');
    expect(countryName('JP', 'en')).toBe('Japan');
  });

  it('falls back to the code itself for an unknown country', () => {
    expect(countryName('XX', 'fr')).toBe('XX');
  });
});

describe('countryFlagColors', () => {
  it('every color row has a valid hex and a percent between 1 and 100', () => {
    for (const code of Object.keys(countriesData)) {
      for (const row of countryFlagColors(code) ?? []) {
        expect(row[FLAG_COLOR_FIELD.HEX]).toMatch(/^#[0-9A-F]{6}$/);
        expect(row[FLAG_COLOR_FIELD.PERCENT]).toBeGreaterThan(0);
        expect(row[FLAG_COLOR_FIELD.PERCENT]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('returns undefined for a country with no flag data', () => {
    expect(countryFlagColors('XX')).toBeUndefined();
  });
});

describe('flagEmoji', () => {
  it('builds the flag from the two regional indicator symbols', () => {
    expect(flagEmoji('FR')).toBe('🇫🇷');
    expect(flagEmoji('JP')).toBe('🇯🇵');
  });

  it('uppercases the code first', () => {
    expect(flagEmoji('fr')).toBe('🇫🇷');
  });
});

describe('countryCurrencyName', () => {
  it('returns the generic currency name, never a nationality adjective', () => {
    expect(countryCurrencyName('FR')).toBe('Euro');
    expect(countryCurrencyName('US')).toBe('Dollar');
    expect(countryCurrencyName('JP')).toBe('Yen');
  });

  it('returns undefined for a country with no currency data', () => {
    expect(countryCurrencyName('XX')).toBeUndefined();
  });
});

describe('decodeCountry', () => {
  const row: CountryRow = ['France', 'France', [['blue', '#0055A4', 33]], 'Euro', '€', '+33'];

  it('decodeCountry turns a positional row into a named entry', () => {
    expect(decodeCountry(row)).toEqual({
      fr: 'France',
      en: 'France',
      flag: [['blue', '#0055A4', 33]],
      currency: 'Euro',
      currencySymbol: '€',
      phoneCode: '+33',
    });
  });

  it('keeps the Contour data of a 7-element row', () => {
    const rowWithContour: CountryRow = [
      'Norvège',
      'Norway',
      [['red', '#EF2B2D', 50]],
      'Couronne',
      'kr',
      '+47',
      {
        points: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        difficulty: 'hard',
      },
    ];

    const decoded = decodeCountry(rowWithContour);
    expect(decoded.contour).toEqual({
      points: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      difficulty: 'hard',
    });
  });
});
