import type { Difficulty } from '@/types';

import charadeData from '../charade.json';
import personalityJobsData from '../personalityJobs.json';
import wordplayData from '../wordplay.json';
import { decodeAllPlaces } from '../places/codec';
import { decodeAllCountries } from '../places/countries';
import personalityPlacesData from '../places/personalityPlaces.json';

import type { CountryDoc, JobDoc, PlaceDoc, RiddleDoc } from './types';

/** Flat `[lon, lat, lon, lat, ...]` (Firestore has no nested arrays). */
export const flattenPoints = (points: readonly (readonly [number, number])[]): number[] => points.flatMap(([lon, lat]) => [lon, lat]);

export const unflattenPoints = (flat: readonly number[]): [number, number][] =>
  Array.from({ length: flat.length / 2 }, (_, index) => [flat[2 * index], flat[2 * index + 1]]);

const PERSONALITY = personalityPlacesData as unknown as Record<string, readonly [string, string | null]>;
const WORDPLAY = wordplayData as unknown as Record<string, { sentence: string; difficulty: Difficulty }>;

/** Readable, permanent id of a place document: `{country}-{name}`, lowercase, accents stripped
 * (`fr-paris`, `gb-londres`). Never recomputed once the document exists — renaming a place keeps its id. */
export const placeSlugId = (code: string, name: string): string =>
  `${code.toLowerCase()}-${name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;

/** One id per place, in `decodeAllPlaces` order: a slug already taken gets `-2`, `-3`... */
const allocatePlaceIds = (rows: { code: string; name: string }[]): string[] => {
  const taken = new Set<string>();
  return rows.map(({ code, name }) => {
    const base = placeSlugId(code, name);
    let id = base;
    for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
    taken.add(id);
    return id;
  });
};

const PLACE_ROWS = decodeAllPlaces();
const PLACE_IDS = allocatePlaceIds(PLACE_ROWS.map(({ common }) => ({ name: common[0], code: common[1] })));

/** The 3-letter key the JSON files (and the first Firestore import) used -> the readable document id. */
export const legacyKeyToPlaceId = (): Record<string, string> =>
  Object.fromEntries(PLACE_ROWS.map(({ key }, index) => [key, PLACE_IDS[index]]));

/** Every `places/{id}` document, joined from the 5 place files + wordplay. */
export const buildPlaceDocs = (): Record<string, PlaceDoc> =>
  Object.fromEntries(
    PLACE_ROWS.map(({ key, common, compass, clues }, index) => {
      const [name, code, latitude, longitude] = common;
      const shared = [compass, clues].find(Boolean)!;
      const personality = PERSONALITY[key];
      const wordplay = WORDPLAY[key];
      const doc: PlaceDoc = {
        name,
        code,
        latitude,
        longitude,
        difficulty: shared.difficulty,
        ...(compass && {
          compass: {
            category: compass.category,
            ...(compass.description !== undefined && { description: compass.description }),
            ...(compass.wikiFr !== undefined && { wikiFr: compass.wikiFr }),
            ...(compass.wikiEn !== undefined && { wikiEn: compass.wikiEn }),
          },
        }),
        ...(clues && {
          clues: {
            positionInCountry: clues.positionInCountry,
            population: clues.population,
            climateEmoji: clues.climateEmoji,
            elevationMeters: clues.elevationMeters,
            timezone: clues.timezone,
            airportCode: clues.airportCode,
            emojis: [...clues.emojis],
            syllables: clues.syllables,
          },
        }),
        ...(personality && { personality: { name: personality[0], jobCode: personality[1] } }),
        ...(wordplay && { wordplay: { sentence: wordplay.sentence, difficulty: wordplay.difficulty } }),
      };
      return [PLACE_IDS[index], doc];
    }),
  );

/** Every `countries/{code}` document, joined from the 6 country files. */
export const buildCountryDocs = (): Record<string, CountryDoc> =>
  Object.fromEntries(
    decodeAllCountries().map((country) => {
      const doc: CountryDoc = {
        fr: country.fr,
        en: country.en,
        ...(country.flag && { flag: country.flag.map(([id, hex, percent]) => ({ id, hex, percent })) }),
        ...(country.currency !== null && { currency: country.currency }),
        ...(country.currencySymbol !== null && { currencySymbol: country.currencySymbol }),
        ...(country.phoneCode !== null && { phoneCode: country.phoneCode }),
        ...(country.contour && {
          contour: {
            points: flattenPoints(country.contour.points),
            ...(country.contour.neighbors && { neighbors: country.contour.neighbors }),
            ...(country.contour.centerLabel && { centerLabel: country.contour.centerLabel }),
            ...(country.contour.difficulty && { difficulty: country.contour.difficulty }),
          },
        }),
        ...(country.neighbors.length > 0 && { borders: [...country.neighbors] }),
      };
      return [country.code, doc];
    }),
  );

/** Every `charadeRiddles/{syllable}` document: the complete dictionary, `null` when not curated. */
export const buildRiddleDocs = (): Record<string, RiddleDoc> =>
  Object.fromEntries(
    Object.entries(charadeData as unknown as Record<string, string | null>).map(([syllable, riddle]) => [syllable, { riddle }]),
  );

/** Every `personalityJobs/{code}` document. */
export const buildJobDocs = (): Record<string, JobDoc> =>
  Object.fromEntries(
    Object.entries(personalityJobsData as unknown as Record<string, readonly [string, string]>).map(([code, [fr, en]]) => [code, { fr, en }]),
  );
