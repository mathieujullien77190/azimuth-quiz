import type { CountryRecord } from '../../api/countries';
import { CONTINENT_OF } from './constants';
import type { Continent, SortKey } from './types';

const collator = new Intl.Collator('fr');

export const sortCountries = (rows: CountryRecord[], key: SortKey, dir: 1 | -1): CountryRecord[] =>
  [...rows].sort((a, b) => collator.compare(a[key], b[key]) * dir);

export const continentOf = (code: string): Continent => CONTINENT_OF[code] ?? 'other';

/** `continent` `null` = all of them. */
export const filterCountries = (rows: CountryRecord[], query: string, continent: Continent | null = null): CountryRecord[] => {
  const q = query.trim().toLowerCase();
  const byContinent = continent === null ? rows : rows.filter((row) => continentOf(row.code) === continent);
  if (!q) return byContinent;
  return byContinent.filter(
    (row) => row.fr.toLowerCase().includes(q) || row.en.toLowerCase().includes(q) || row.code.toLowerCase().includes(q),
  );
};
