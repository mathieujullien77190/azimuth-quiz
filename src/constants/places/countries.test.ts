import { PLACES } from '@/constants';

import { COUNTRY_NAMES, countryCurrencyName, countryFlagColors, countryName, FLAG_COLOR_FIELD } from './countries';

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
