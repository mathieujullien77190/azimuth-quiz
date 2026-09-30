import type { Difficulty } from '@/types';

import charadeData from '../charade.json';
import personalityJobsData from '../personalityJobs.json';
import wordplayData from '../wordplay.json';
import { decodeAllPlaces } from '../places/codec';
import { decodeAllCountries } from '../places/countries';
import personalityPlacesData from '../places/personalityPlaces.json';

import { buildContourDocs } from './contourDocs';
import { countrySnapshot } from './denormalize';
import { riddlesOf } from './riddles';
import { CLUES_NUMBERING, cluesCategory, computeNumbering } from './numbering';
import type {
  CluesCountsDoc,
  CompassCountsDoc,
  ContourCountryDoc,
  ContourCountsDoc,
  CountryDoc,
  JobDoc,
  PlaceDoc,
  RiddleDoc,
} from './types';

/** Flat `[lon, lat, lon, lat, ...]` (Firestore has no nested arrays). */
export const flattenPoints = (points: readonly (readonly [number, number])[]): number[] =>
  points.flatMap(([lon, lat]) => [lon, lat]);

export const unflattenPoints = (flat: readonly number[]): [number, number][] =>
  Array.from({ length: flat.length / 2 }, (_, index) => [flat[2 * index], flat[2 * index + 1]]);

const PERSONALITY = personalityPlacesData as unknown as Record<string, readonly [string, string | null]>;
const RIDDLES = charadeData as unknown as Record<string, string | null>;
const JOBS = personalityJobsData as unknown as Record<string, readonly [string, string]>;
const WORDPLAY = wordplayData as unknown as Record<string, { sentence: string; difficulty: Difficulty }>;

const buildCountries = (embedContour: boolean): Record<string, CountryDoc> =>
  Object.fromEntries(
    decodeAllCountries().map((country) => {
      const doc: CountryDoc = {
        fr: country.fr,
        en: country.en,
        ...(country.flag && { flag: country.flag.map(([id, hex, percent]) => ({ id, hex, percent })) }),
        ...(country.currency !== null && { currency: country.currency }),
        ...(country.currencySymbol !== null && { currencySymbol: country.currencySymbol }),
        ...(country.phoneCode !== null && { phoneCode: country.phoneCode }),
        ...(embedContour &&
          country.contour && {
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

/** Every country joined from the 6 country files, silhouette embedded in `contour` — the shape the admin
 * finds in Firestore BEFORE its contour migration (it is the input of `buildContourDocs`). */
export const buildLegacyCountryDocs = (): Record<string, CountryDoc> => buildCountries(true);

/** Every `countries/{code}` document: identity, flag, currency, phone code, land borders. The silhouettes
 * live in `contours/{code}` (see `buildContourDocsFromJson`). */
export const buildCountryDocs = (): Record<string, CountryDoc> => buildCountries(false);

/** Every place joined from the 5 place files + wordplay + a copy of its country, not yet numbered. */
const buildUnnumberedPlaceDocs = (): Record<string, PlaceDoc> => {
  const countries = buildLegacyCountryDocs();
  return Object.fromEntries(
    decodeAllPlaces().map(({ key, common, compass, clues }) => {
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
        ...(countries[code] && { country: countrySnapshot(countries[code]) }),
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
            riddles: riddlesOf(clues.syllables, RIDDLES),
          },
        }),
        ...(personality && {
          personality: {
            name: personality[0],
            jobCode: personality[1],
            ...(personality[1] !== null && { job: { fr: JOBS[personality[1]][0], en: JOBS[personality[1]][1] } }),
          },
        }),
        ...(wordplay && { wordplay: { sentence: wordplay.sentence, difficulty: wordplay.difficulty } }),
      };
      if (doc.clues) doc.clues.category = cluesCategory(doc);
      return [key, doc];
    }),
  );
};

const buildNumbered = () => {
  const places = buildUnnumberedPlaceDocs();
  const compass = computeNumbering(Object.entries(places));
  for (const [key, n] of Object.entries(compass.numbers)) places[key].n = n;
  const clues = computeNumbering(Object.entries(places), { numbering: CLUES_NUMBERING });
  for (const [key, n] of Object.entries(clues.numbers)) places[key].clues!.n = n;
  return { places, compassCounts: compass.counts, cluesCounts: clues.counts };
};

/** Every `places/{key}` document: joined from the 5 place files + wordplay, with a copy of the country;
 * Compass places numbered `n` = 1..size inside their group (category x difficulty) and Clues places
 * `clues.n` inside theirs (`clues.category` x difficulty), both in the shuffled order of `shuffleRank`. */
export const buildPlaceDocs = (): Record<string, PlaceDoc> => buildNumbered().places;

/** `meta/compassCounts`: the size of every Compass group, matching `buildPlaceDocs`' numbering. */
export const buildCompassCounts = (): CompassCountsDoc => ({ counts: buildNumbered().compassCounts, shuffled: true });

/** `meta/cluesCounts`: the size of every Clues group, matching `buildPlaceDocs`' numbering. */
export const buildCluesCounts = (): CluesCountsDoc => ({ counts: buildNumbered().cluesCounts, shuffled: true });

const buildContours = () => buildContourDocs(buildLegacyCountryDocs(), Object.values(buildUnnumberedPlaceDocs()));

/** Every `contours/{code}` document (silhouette, names, neighbors, capital and cities), numbered inside the
 * difficulty group in the shuffled order. */
export const buildContourDocsFromJson = (): Record<string, ContourCountryDoc> => buildContours().docs;

/** `meta/contourCounts`: the size of every silhouette difficulty group. */
export const buildContourCounts = (): ContourCountsDoc => ({ counts: buildContours().counts, shuffled: true });

/** Every `charadeRiddles/{syllable}` document: the complete dictionary, `null` when not curated. */
export const buildRiddleDocs = (): Record<string, RiddleDoc> =>
  Object.fromEntries(
    Object.entries(charadeData as unknown as Record<string, string | null>).map(([syllable, riddle]) => [
      syllable,
      { riddle },
    ]),
  );

/** Every `personalityJobs/{code}` document. */
export const buildJobDocs = (): Record<string, JobDoc> =>
  Object.fromEntries(
    Object.entries(personalityJobsData as unknown as Record<string, readonly [string, string]>).map(
      ([code, [fr, en]]) => [code, { fr, en }],
    ),
  );
