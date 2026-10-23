import type { CountryDoc } from '@/data/firestore/types';
import type { FlagColorRow } from '@/types';

import { applyCountryChange, data } from '../data';

/** Un pays tel que l'admin le liste et l'edite (ses lieux en portent une copie). */
export type CountryRecord = {
  code: string;
  fr: string;
  en: string;
  flag: FlagColorRow[] | null;
  currency: string | null;
  currencySymbol: string | null;
  phoneCode: string | null;
};

const recordOf = (code: string, doc: CountryDoc): CountryRecord => ({
  code,
  fr: doc.fr,
  en: doc.en,
  flag: doc.flag ? doc.flag.map(({ id, hex, percent }) => [id, hex, percent] as const) : null,
  currency: doc.currency ?? null,
  currencySymbol: doc.currencySymbol ?? null,
  phoneCode: doc.phoneCode ?? null,
});

/** Lit la copie en memoire de Firestore (voir `data.ts`) ; `async` pour que les appelants n'en dependent pas. */
export const fetchCountries = async (): Promise<CountryRecord[]> =>
  Object.entries(data().countries).map(([code, doc]) => recordOf(code, doc));

export type CountryPatch = Partial<
  Pick<CountryRecord, 'fr' | 'en' | 'currency' | 'currencySymbol' | 'phoneCode' | 'flag'>
>;

export const saveCountry = async (row: CountryRecord, patch: CountryPatch): Promise<CountryRecord> => {
  const { flag, fr, en, currency, currencySymbol, phoneCode } = patch;
  // Le document stocke sert de base : ses autres champs (restes de Silhouette) sont reecrits tels quels.
  const doc = { ...data().countries[row.code] };
  if (fr !== undefined) doc.fr = fr;
  if (en !== undefined) doc.en = en;
  // Un champ optionnel vide est retire du document, pas stocke vide.
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
  // Le pays et toutes ses copies (ses lieux) sont ecrits ensemble.
  await applyCountryChange(row.code, doc);
  return { ...row, ...patch };
};
