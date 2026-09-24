import { decodeCountry, type CountryEntry, type CountryRow } from '@/constants/places/countries';

import { getJson, putJson } from './http';

export type CountryRecord = CountryEntry & { code: string };

export const fetchCountries = async (): Promise<CountryRecord[]> => {
  const countries = await getJson<Record<string, CountryRow>>('/api/countries', 'Impossible de charger les pays.');
  return Object.entries(countries).map(([code, row]) => ({ code, ...decodeCountry(row) }));
};

export type CountryPatch = Partial<Pick<CountryEntry, 'fr' | 'en' | 'currency' | 'currencySymbol' | 'phoneCode' | 'flag'>>;

export const saveCountry = (code: string, patch: CountryPatch): Promise<CountryRecord> => putJson(`/api/countries/${code}`, patch);
