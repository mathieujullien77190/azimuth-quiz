import { decodeAllCountries, type CountryEntry } from '@/data/places/countries';

import { logChange } from '../changelog';

export type CountryRecord = CountryEntry & { code: string };

/** Reads the bundled place files (no network, no backend — see changelog.ts): kept `async`
 * so call sites reading it don't need to change just because this no longer fetches anything. */
export const fetchCountries = async (): Promise<CountryRecord[]> => decodeAllCountries();

export type CountryPatch = Partial<Pick<CountryEntry, 'fr' | 'en' | 'currency' | 'currencySymbol' | 'phoneCode' | 'flag'>>;

const fmt = (value: unknown): string => (value === null || value === undefined ? '(vide)' : Array.isArray(value) ? JSON.stringify(value) : String(value));

export const saveCountry = async (row: CountryRecord, patch: CountryPatch): Promise<CountryRecord> => {
  for (const key of Object.keys(patch) as (keyof CountryPatch)[]) {
    logChange(`[Pays] ${row.fr} (${row.code}) — ${key} : ${fmt(row[key])} -> ${fmt(patch[key])}`);
  }
  return { ...row, ...patch };
};
