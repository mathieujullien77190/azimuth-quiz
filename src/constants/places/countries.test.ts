import { PLACES } from '@/constants';

import type { CountryRow } from './countries';
import {
  COUNTRY_NAMES,
  countryCurrencyName,
  countryFlagColors,
  countryName,
  decodeCountry,
  encodeCountry,
  FLAG_COLOR_FIELD,
  flagEmoji,
  serializeCountries,
} from './countries';

describe('COUNTRY_NAMES', () => {
  it('gives both fr and en names for every entry', () => {
    for (const [code, names] of Object.entries(COUNTRY_NAMES)) {
      expect(names.fr.length).toBeGreaterThan(0);
      expect(names.en.length).toBeGreaterThan(0);
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('covers every country code used by PLACES', () => {
    const missing = [...new Set(PLACES.map((place) => place.code))].filter((code) => !(code in COUNTRY_NAMES));
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
    for (const code of Object.keys(COUNTRY_NAMES)) {
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

describe('decodeCountry / encodeCountry', () => {
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

  it('encodeCountry is the inverse of decodeCountry', () => {
    expect(encodeCountry(decodeCountry(row))).toEqual(row);
  });
});

describe('serializeCountries', () => {
  it('sorts by code and prints one entry per line', () => {
    const countries: Record<string, CountryRow> = {
      GB: ['Royaume-Uni', 'United Kingdom', null, null, null, '+44'],
      FR: ['France', 'France', null, null, null, '+33'],
    };
    expect(serializeCountries(countries)).toBe(
      '{\n' + '  "FR": ["France","France",null,null,null,"+33"],\n' + '  "GB": ["Royaume-Uni","United Kingdom",null,null,null,"+44"]\n' + '}\n',
    );
  });
});
