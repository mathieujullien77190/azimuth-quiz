import { PLACES } from '@/constants';

import { COUNTRY_NAMES, countryName } from './countries';

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
