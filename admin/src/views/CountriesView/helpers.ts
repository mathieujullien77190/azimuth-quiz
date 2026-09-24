import type { CountryRecord } from '../../api/countries';
import type { SortKey } from './types';

const collator = new Intl.Collator('fr');

export const sortCountries = (rows: CountryRecord[], key: SortKey, dir: 1 | -1): CountryRecord[] =>
  [...rows].sort((a, b) => collator.compare(a[key], b[key]) * dir);

export const filterCountries = (rows: CountryRecord[], query: string): CountryRecord[] => {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.fr.toLowerCase().includes(q) || row.en.toLowerCase().includes(q) || row.code.toLowerCase().includes(q));
};
