import { PLACES } from '@/data';

import countriesData from './countries.json';
import countryBordersData from './countryBorders.json';
import {
  countryCurrencyName,
  countryFlagColors,
  countryName,
  countryNeighbors,
  decodeAllCountries,
  decodeCountry,
  FLAG_COLOR_FIELD,
  flagEmoji,
} from './countries';

describe('the countries data', () => {
  const identity = countriesData as unknown as Record<string, readonly [string, string]>;
  const borders = countryBordersData as unknown as Record<string, readonly string[]>;

  it('gives both fr and en names for every entry', () => {
    for (const [code, row] of Object.entries(identity)) {
      expect(row[0].length).toBeGreaterThan(0);
      expect(row[1].length).toBeGreaterThan(0);
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('lists land neighbors as sorted, unique codes of known countries, never the country itself', () => {
    for (const [code, neighbors] of Object.entries(borders)) {
      expect(neighbors).not.toContain(code);
      expect([...neighbors].sort()).toEqual([...neighbors]);
      expect(new Set(neighbors).size).toBe(neighbors.length);
      for (const neighbor of neighbors) expect(identity).toHaveProperty(neighbor);
      // An empty list is never stored: no neighbors means no entry at all.
      expect(neighbors.length).toBeGreaterThan(0);
    }
  });

  it('is symmetric: A is a neighbor of B <=> B is a neighbor of A', () => {
    for (const [code, neighbors] of Object.entries(borders)) {
      for (const neighbor of neighbors) expect(borders[neighbor]).toContain(code);
    }
  });

  it('covers every country code used by PLACES', () => {
    const missing = [...new Set(PLACES.map((place) => place.code))].filter((code) => !(code in identity));
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
  it('joins the 6 files into a named entry', () => {
    expect(decodeCountry('FR')).toEqual(
      expect.objectContaining({
        fr: 'France',
        en: 'France',
        flag: [
          ['blue', '#0055A4', 33],
          ['white', '#FFFFFF', 33],
          ['red', '#EF4135', 33],
        ],
        currency: 'Euro',
        currencySymbol: '€',
        phoneCode: '+33',
        neighbors: expect.arrayContaining(['BE', 'DE', 'ES', 'IT', 'CH']),
      }),
    );
  });

  it('is null for a code with no entry in countries.json at all', () => {
    expect(decodeCountry('XX')).toBeNull();
  });

  it('falls back to no flag/currency/phone code/neighbors when a country has none curated yet', () => {
    // Antarctica ("AQ"): identity only, everything else genuinely absent.
    expect(decodeCountry('AQ')).toEqual({
      fr: 'Antarctique',
      en: 'Antarctica',
      flag: null,
      currency: null,
      currencySymbol: null,
      phoneCode: null,
      contour: undefined,
      neighbors: [],
    });
  });

  it('keeps the Contour data when there is one', () => {
    expect(decodeCountry('NO')?.contour).toBeDefined();
    expect(decodeCountry('NO')?.contour?.difficulty).toBe('hard');
  });
});

describe('decodeAllCountries', () => {
  it('joins every country in countries.json (the admin’s own listing)', () => {
    const all = decodeAllCountries();
    expect(all.length).toBe(Object.keys(countriesData).length);
    expect(all).toContainEqual(expect.objectContaining({ code: 'FR', fr: 'France' }));
  });
});

describe('countryNeighbors', () => {
  it('returns the codes sharing a land border, sorted', () => {
    expect(countryNeighbors('FR')).toEqual(expect.arrayContaining(['BE', 'DE', 'ES', 'IT', 'CH']));
    expect(countryNeighbors('MC')).toEqual(['FR']);
  });

  it('returns an empty list for an island or an unknown country', () => {
    expect(countryNeighbors('JP')).toEqual([]);
    expect(countryNeighbors('XX')).toEqual([]);
  });
});
