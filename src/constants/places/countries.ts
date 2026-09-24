import type { Language } from '@/i18n';
import type { IndicesFlagColorRow } from '@/types';

import countriesData from './countries.json';

/**
 * Donnees par pays (code ISO 3166-1 alpha-2, cle de l'objet), partagees par Boussole et Indices :
 * chaque pays est stocke comme un tuple positionnel `[fr, en, flag, currency, currencySymbol,
 * phoneCode]` plutot qu'un objet a champs nommes (196 pays x 6 champs : les noms de propriete
 * repetes pesaient lourd pour rien — meme raisonnement que `places.json`, voir `codec.ts`).
 * `flag`/`currency`/`currencySymbol`/`phoneCode` valent `null` si pas encore renseignes (un pays
 * peut exister sans qu'aucun lieu l'utilise encore dans Indices). Les lieux ne stockent que
 * `code` : le reste s'en deduit ici, evitant de le repeter (et de le desynchroniser) par lieu —
 * devise/indicatif ne varient jamais au sein d'un meme pays, contrairement a la difficulte ou
 * l'anecdote qui sont propres a chaque lieu.
 */
export type CountryRow = readonly [
  fr: string,
  en: string,
  flag: IndicesFlagColorRow[] | null,
  currency: string | null,
  currencySymbol: string | null,
  phoneCode: string | null,
];

export type CountryEntry = {
  fr: string;
  en: string;
  flag: IndicesFlagColorRow[] | null;
  currency: string | null;
  currencySymbol: string | null;
  phoneCode: string | null;
};

const COUNTRIES = countriesData as unknown as Record<string, CountryRow>;

export const decodeCountry = (row: CountryRow): CountryEntry => {
  const [fr, en, flag, currency, currencySymbol, phoneCode] = row;
  return { fr, en, flag, currency, currencySymbol, phoneCode };
};

export const encodeCountry = (entry: CountryEntry): CountryRow => [entry.fr, entry.en, entry.flag, entry.currency, entry.currencySymbol, entry.phoneCode];

export const COUNTRY_NAMES: Record<string, { fr: string; en: string }> = Object.fromEntries(
  Object.entries(COUNTRIES).map(([code, row]) => [code, { fr: row[0], en: row[1] }]),
);

export const countryName = (code: string, language: Language): string => {
  const row = COUNTRIES[code];
  if (!row) return code;
  return language === 'fr' ? row[0] : row[1];
};

/** Index des champs d'une ligne de `flag` (tuple positionnel, voir `IndicesFlagColorRow`). */
export const FLAG_COLOR_FIELD = {
  COLOR_ID: 0,
  HEX: 1,
  PERCENT: 2,
} as const;

export const countryFlagColors = (code: string): IndicesFlagColorRow[] | undefined => COUNTRIES[code]?.[2] ?? undefined;

/** Nom generique de la devise (jamais l'adjectif de nationalite : "Dollar", pas "Dollar
 * zimbabween" ni "Dollar americain" — ça reviendrait a donner le pays). */
export const countryCurrencyName = (code: string): string | undefined => COUNTRIES[code]?.[3] ?? undefined;

/** Symbole/code de la devise (ex. "€", "AED") : plusieurs pays peuvent legitimement le partager
 * (zone euro...). */
export const countryCurrencySymbol = (code: string): string | undefined => COUNTRIES[code]?.[4] ?? undefined;

/** Indicatif telephonique international (ex. "+33"). */
export const countryPhoneCode = (code: string): string | undefined => COUNTRIES[code]?.[5] ?? undefined;

/** Une entree par ligne (au lieu du multi-ligne par defaut de `JSON.stringify(_, null, 2)`) : un
 * `git diff` sur un seul pays modifie touche une seule ligne. Utilise par `admin/vite.config.ts`
 * pour reecrire `countries.json` apres une edition. */
export const serializeCountries = (countries: Record<string, CountryRow>): string => {
  const lines = Object.keys(countries)
    .sort()
    .map((code) => '  ' + JSON.stringify(code) + ': ' + JSON.stringify(countries[code]));
  return '{\n' + lines.join(',\n') + '\n}\n';
};
