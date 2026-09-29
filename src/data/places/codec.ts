import type { Category, Difficulty, CluePlace, CluePositionInCountry, Place } from '@/types';

import codesData from './codes.json';
import { countryName, countryPhoneCode, countryCurrencySymbol } from './countries';

/**
 * `places.json` is the shared source of places for BOTH Compass and Clues: an array of places,
 * and each place is itself `[common, compass, clues]`. `common` always exists (name, code,
 * coordinates, and difficulty — shared across both games); `compass` is `null` if this place
 * isn't in the Compass pool, `clues` is `null` if it isn't in the Clues pool (a place can be
 * in only one of the two). `decodeCompassPlaces`/`decodeCluePlaces` are the only
 * place that knows the column order: `src/data/places/index.ts`, `src/data/
 * clues.ts` and `admin/src/api/places.ts` all import from here rather than re-encoding it.
 * `places.json` itself is GENERATED (`npm run generate:places`) from the readable
 * `scripts/placesSource.json` (named fields, not positional) — edit that file, or the compact
 * one directly for a one-off (both decode/encode the same way, see `generatePlaces.mjs`).
 */

// Category/difficulty/timezone: readable-name -> compact code, shared with `generatePlaces.mjs`
// (JSON so a plain Node script can read it too, no TS build step). Timezone codes are append-only
// — reusing an existing zone's code would silently reassign it, corrupting every place already
// using it.
const CATEGORY_CODES = codesData.category as Record<Category, string>;
const DIFFICULTY_CODES = codesData.difficulty as Record<Difficulty, string>;
const TIMEZONE_CODES: Record<string, string> = codesData.timezone;

const CATEGORY_BY_CODE = Object.fromEntries(
  Object.entries(CATEGORY_CODES).map(([category, code]) => [code, category]),
) as Record<string, Category>;

const DIFFICULTY_BY_CODE = Object.fromEntries(
  Object.entries(DIFFICULTY_CODES).map(([difficulty, code]) => [code, difficulty]),
) as Record<string, Difficulty>;

const TIMEZONE_BY_CODE = Object.fromEntries(Object.entries(TIMEZONE_CODES).map(([tz, code]) => [code, tz])) as Record<
  string,
  string
>;

/** `difficultyCode` lives here, not per-game: the two games never actually disagreed on a
 * place's difficulty in practice, so tracking it twice was pure duplication (see git history
 * for the merge). */
export type CommonRow = readonly [
  name: string,
  code: string,
  latitude: number,
  longitude: number,
  difficultyCode: string,
];

export type CompassRow = readonly [
  categoryCode: string,
  description: string | null,
  wikiFr: string | null,
  wikiEn: string | null,
];

export type ClueRow = readonly [
  positionInCountry: CluePositionInCountry,
  population: number,
  climateEmoji: string,
  elevationMeters: number,
  timezoneCode: string,
  airportCode: string,
  emoji1: string,
  emoji2: string,
  emoji3: string,
  /** Hand-corrected syllable split for the charade clue (`helpers/charade.ts`) — absent for
   * (almost) every place, which then uses the live `syllabify` heuristic instead; present only
   * where that heuristic gets it wrong (foreign diacritics, mostly). Always lowercase. Can be an
   * empty array on purpose: some names have no usable syllable at all (e.g. "Bălți", whose "ă"
   * the heuristic doesn't recognize) — `cluesFor` then drops the charade clue entirely rather
   * than showing an empty card. */
  syllables?: readonly string[],
];

/** A place: common data (including difficulty) + its per-game parts. `compass`/`clues` are
 * `null` when this place doesn't exist in that game. */
type PlaceEntry = readonly [common: CommonRow, compass: CompassRow | null, clues: ClueRow | null];

export type MergedPlaces = readonly PlaceEntry[];

export const decodeCompassPlace = (common: CommonRow, row: CompassRow): Place => {
  const [name, code, latitude, longitude, difficultyCode] = common;
  const [categoryCode, description, wikiFr, wikiEn] = row;
  return {
    name,
    code,
    category: CATEGORY_BY_CODE[categoryCode],
    difficulty: DIFFICULTY_BY_CODE[difficultyCode],
    coordinates: { latitude, longitude },
    ...(description !== null && { description }),
    ...(wikiFr !== null && { wikiFr }),
    ...(wikiEn !== null && { wikiEn }),
  };
};

export const decodeCompassPlaces = (entries: MergedPlaces): Place[] => {
  const places: Place[] = [];
  for (const [common, compass] of entries) {
    if (compass) places.push(decodeCompassPlace(common, compass));
  }
  return places;
};

export const decodeCluePlace = (common: CommonRow, row: ClueRow): CluePlace => {
  const [name, code, latitude, longitude, difficultyCode] = common;
  const [
    positionInCountry,
    population,
    climateEmoji,
    elevationMeters,
    timezoneCode,
    airportCode,
    emoji1,
    emoji2,
    emoji3,
    syllables,
  ] = row;
  return {
    name,
    code,
    country: countryName(code, 'fr'),
    coordinates: { latitude, longitude },
    difficulty: DIFFICULTY_BY_CODE[difficultyCode],
    positionInCountry,
    population,
    climateEmoji,
    elevationMeters,
    timezone: TIMEZONE_BY_CODE[timezoneCode] ?? timezoneCode,
    phoneCode: countryPhoneCode(code) ?? '',
    currency: countryCurrencySymbol(code) ?? '',
    airportCode,
    emojis: [emoji1, emoji2, emoji3] as const,
    ...(syllables !== undefined && { syllables: [...syllables] }),
  };
};

export const decodeCluePlaces = (entries: MergedPlaces): CluePlace[] => {
  const places: CluePlace[] = [];
  for (const [common, , clues] of entries) {
    if (clues) places.push(decodeCluePlace(common, clues));
  }
  return places;
};
