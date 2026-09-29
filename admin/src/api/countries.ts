import type { CountryEntry } from '@/data/places/countries';
import type { CountryDoc } from '@/data/firestore/types';

import { data, putCountry } from '../data';

export type CountryRecord = CountryEntry & { code: string };

const recordOf = (code: string, doc: CountryDoc): CountryRecord => ({
  code,
  fr: doc.fr,
  en: doc.en,
  flag: doc.flag ? doc.flag.map(({ id, hex, percent }) => [id, hex, percent] as const) : null,
  currency: doc.currency ?? null,
  currencySymbol: doc.currencySymbol ?? null,
  phoneCode: doc.phoneCode ?? null,
  neighbors: doc.borders ?? [],
});

/** Reads the in-memory copy of Firestore (see `data.ts`): kept `async` so call sites don't care. */
export const fetchCountries = async (): Promise<CountryRecord[]> =>
  Object.entries(data().countries).map(([code, doc]) => recordOf(code, doc));

export type CountryPatch = Partial<Pick<CountryEntry, 'fr' | 'en' | 'currency' | 'currencySymbol' | 'phoneCode' | 'flag'>>;

export const saveCountry = async (row: CountryRecord, patch: CountryPatch): Promise<CountryRecord> => {
  const { flag, fr, en, currency, currencySymbol, phoneCode } = patch;
  const doc = { ...data().countries[row.code] };
  if (fr !== undefined) doc.fr = fr;
  if (en !== undefined) doc.en = en;
  // An emptied optional field is removed from the document rather than stored blank.
  const setOrDrop = (field: 'currency' | 'currencySymbol' | 'phoneCode', value: string | null | undefined) => {
    if (value === undefined) return;
    if (value) doc[field] = value;
    else delete doc[field];
  };
  setOrDrop('currency', currency);
  setOrDrop('currencySymbol', currencySymbol);
  setOrDrop('phoneCode', phoneCode);
  if (flag !== undefined) {
    if (flag && flag.length > 0) doc.flag = flag.map(([id, hex, percent]) => ({ id, hex, percent }));
    else delete doc.flag;
  }
  await putCountry(row.code, doc);
  return { ...row, ...patch };
};
