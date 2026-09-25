import type { Language } from '@/i18n';
import type { ContourDataRow, IndicesFlagColorRow } from '@/types';

import countriesData from './countries.json';

/**
 * Per-country data (ISO 3166-1 alpha-2 code, the object's key), shared by Boussole and Indices:
 * each country is stored as a positional tuple `[fr, en, flag, currency, currencySymbol,
 * phoneCode, contour?]` rather than an object with named fields (209 countries x up to 7 fields:
 * the repeated property names weighed a lot for nothing — same reasoning as `places.json`, see
 * `codec.ts`). `flag`/`currency`/`currencySymbol`/`phoneCode` are `null` when not filled in yet (a
 * country can exist without any place using it yet in Indices). Places only store `code`:
 * everything else is derived from here, avoiding repeating it (and desyncing it) per place —
 * currency/phone code never vary within a given country, unlike difficulty or the trivia, which
 * are specific to each place. `contour` (see `ContourDataRow`) is the 7th element, present only
 * for a country with Contour/Silhouette data (`constants/contours/codec.ts` reads it) — omitted
 * entirely (not `null`) for the many countries without one, so a plain row stays 6 elements.
 */
export type CountryRow = readonly [
  fr: string,
  en: string,
  flag: IndicesFlagColorRow[] | null,
  currency: string | null,
  currencySymbol: string | null,
  phoneCode: string | null,
  contour?: ContourDataRow,
];

export type CountryEntry = {
  fr: string;
  en: string;
  flag: IndicesFlagColorRow[] | null;
  currency: string | null;
  currencySymbol: string | null;
  phoneCode: string | null;
  /** Absent for the many countries with no Contour/Silhouette data — see `CountryRow`. */
  contour?: ContourDataRow;
};

const COUNTRIES = countriesData as unknown as Record<string, CountryRow>;

export const decodeCountry = (row: CountryRow): CountryEntry => {
  const [fr, en, flag, currency, currencySymbol, phoneCode, contour] = row;
  return { fr, en, flag, currency, currencySymbol, phoneCode, contour };
};

/** Inverse of `decodeCountry` — round-trips losslessly: a `contour`-less entry re-encodes to a
 * plain 6-element row (no trailing `undefined`), one with `contour` set re-encodes to 7. */
export const encodeCountry = (entry: CountryEntry): CountryRow =>
  entry.contour === undefined
    ? [entry.fr, entry.en, entry.flag, entry.currency, entry.currencySymbol, entry.phoneCode]
    : [entry.fr, entry.en, entry.flag, entry.currency, entry.currencySymbol, entry.phoneCode, entry.contour];

export const COUNTRY_NAMES: Record<string, { fr: string; en: string }> = Object.fromEntries(
  Object.entries(COUNTRIES).map(([code, row]) => [code, { fr: row[0], en: row[1] }]),
);

export const countryName = (code: string, language: Language): string => {
  const row = COUNTRIES[code];
  if (!row) return code;
  return language === 'fr' ? row[0] : row[1];
};

/** Field indexes of a `flag` row (positional tuple, see `IndicesFlagColorRow`). */
export const FLAG_COLOR_FIELD = {
  COLOR_ID: 0,
  HEX: 1,
  PERCENT: 2,
} as const;

export const countryFlagColors = (code: string): IndicesFlagColorRow[] | undefined => COUNTRIES[code]?.[2] ?? undefined;

/** Generic currency name (never the nationality adjective: "Dollar", not "Zimbabwean
 * Dollar" or "American Dollar" — that would amount to giving away the country). */
export const countryCurrencyName = (code: string): string | undefined => COUNTRIES[code]?.[3] ?? undefined;

/** Currency symbol/code (e.g. "€", "AED"): several countries can legitimately share
 * one (euro zone...). */
export const countryCurrencySymbol = (code: string): string | undefined => COUNTRIES[code]?.[4] ?? undefined;

/** International phone code (e.g. "+33"). */
export const countryPhoneCode = (code: string): string | undefined => COUNTRIES[code]?.[5] ?? undefined;

/** The actual flag emoji for an ISO 3166-1 alpha-2 code (e.g. "FR" -> 🇫🇷): built from the two
 * regional indicator symbols, not stored data — works for any valid code. Relies on
 * `FLAG_FONT_FAMILY` (see themes/fonts.ts) being applied wherever this is rendered, since some
 * platforms (Chromium on Windows) don't ship a system font that renders these as flags. */
export const flagEmoji = (code: string): string =>
  code
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join('');

/** One entry per line (instead of the multi-line default of `JSON.stringify(_, null, 2)`): a
 * `git diff` touching a single country's data only touches one line. Used by `admin/vite.config.ts`
 * to rewrite `countries.json` after an edit. */
export const serializeCountries = (countries: Record<string, CountryRow>): string => {
  const lines = Object.keys(countries)
    .sort()
    .map((code) => '  ' + JSON.stringify(code) + ': ' + JSON.stringify(countries[code]));
  return '{\n' + lines.join(',\n') + '\n}\n';
};
