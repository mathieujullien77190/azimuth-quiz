import { describe, expect, it } from 'vitest';

import type { CountryRecord } from '../../api/countries';

import { CONTINENT_OF } from './constants';
import { continentOf, filterCountries, sortCountries } from './helpers';

const row = (code: string, fr: string, en: string) => ({ code, fr, en }) as CountryRecord;
const rows = [
  row('FR', 'France', 'France'),
  row('JP', 'Japon', 'Japan'),
  row('BR', 'Brésil', 'Brazil'),
  row('ZZ', 'Zed', 'Zed'),
];

describe('continentOf', () => {
  it('finds the continent of a known code and falls back to other', () => {
    expect(continentOf('FR')).toBe('europe');
    expect(continentOf('JP')).toBe('asia');
    expect(continentOf('ZZ')).toBe('other');
    expect(CONTINENT_OF.AQ).toBe('other');
  });
});

describe('sortCountries', () => {
  it('sorts by key in both directions without mutating the input', () => {
    const copy = [...rows];
    expect(sortCountries(rows, 'fr', 1).map((r) => r.code)).toEqual(['BR', 'FR', 'JP', 'ZZ']);
    expect(sortCountries(rows, 'en', -1).map((r) => r.code)).toEqual(['ZZ', 'JP', 'FR', 'BR']);
    expect(rows).toEqual(copy);
  });
});

describe('filterCountries', () => {
  it('returns everything without query or continent', () => {
    expect(filterCountries(rows, '  ')).toHaveLength(4);
  });

  it('filters by continent', () => {
    expect(filterCountries(rows, '', 'asia').map((r) => r.code)).toEqual(['JP']);
  });

  it('matches French name, English name or code, ignoring case', () => {
    expect(filterCountries(rows, 'brésil').map((r) => r.code)).toEqual(['BR']);
    expect(filterCountries(rows, 'JAPAN').map((r) => r.code)).toEqual(['JP']);
    expect(filterCountries(rows, 'zz').map((r) => r.code)).toEqual(['ZZ']);
    expect(filterCountries(rows, 'fr', 'europe').map((r) => r.code)).toEqual(['FR']);
  });
});
