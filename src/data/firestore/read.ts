import type { CluePlace, ContourCountry, Difficulty, Place } from '@/types';

import { unflattenPoints } from './build';
import type { CompassDoc, CountryDoc, JobDoc, PlaceDoc } from './types';

/** `Place` (Compass) from its document. */
export const compassFromDoc = (doc: PlaceDoc & { compass: CompassDoc }): Place => ({
  name: doc.name,
  code: doc.code,
  category: doc.compass.category,
  difficulty: doc.difficulty,
  coordinates: { latitude: doc.latitude, longitude: doc.longitude },
  ...(doc.compass.description !== undefined && { description: doc.compass.description }),
  ...(doc.compass.wikiFr !== undefined && { wikiFr: doc.compass.wikiFr }),
  ...(doc.compass.wikiEn !== undefined && { wikiEn: doc.compass.wikiEn }),
});

/** What `cluesFromDoc` needs from the place's country and the jobs vocabulary. */
export type CluesLookups = {
  countries: Record<string, CountryDoc>;
  jobs: Record<string, JobDoc>;
};

/** `CluePlace` from its document — country name, phone code and currency come from the country
 * (never duplicated per place), the personality's job from the shared vocabulary. */
export const cluesFromDoc = (
  key: string,
  doc: PlaceDoc & { clues: NonNullable<PlaceDoc['clues']> },
  { countries, jobs }: CluesLookups,
): CluePlace => {
  const country = countries[doc.code];
  const { personality } = doc;
  return {
    key,
    name: doc.name,
    code: doc.code,
    country: country?.fr ?? doc.code,
    coordinates: { latitude: doc.latitude, longitude: doc.longitude },
    difficulty: doc.difficulty,
    positionInCountry: doc.clues.positionInCountry,
    population: doc.clues.population,
    climateEmoji: doc.clues.climateEmoji,
    elevationMeters: doc.clues.elevationMeters,
    timezone: doc.clues.timezone,
    phoneCode: country?.phoneCode ?? '',
    currency: country?.currencySymbol ?? '',
    airportCode: doc.clues.airportCode,
    emojis: doc.clues.emojis as unknown as CluePlace['emojis'],
    syllables: [...doc.clues.syllables],
    ...(personality && {
      personality: {
        name: personality.name,
        description: personality.jobCode !== null ? jobs[personality.jobCode].fr : null,
      },
    }),
  };
};

const DEFAULT_CENTER_LABEL = { x: 0.5, y: 0.5 };
const DEFAULT_CONTOUR_DIFFICULTY: Difficulty = 'intermediate';

/** `ContourCountry` from a country document, `null` when it has no silhouette. Same defaults as
 * `data/contours/codec.ts`. */
export const contourFromDoc = (code: string, doc: CountryDoc): ContourCountry | null =>
  doc.contour
    ? {
        code,
        points: unflattenPoints(doc.contour.points),
        neighbors: doc.contour.neighbors ?? [],
        centerLabel: doc.contour.centerLabel ?? DEFAULT_CENTER_LABEL,
        difficulty: doc.contour.difficulty ?? DEFAULT_CONTOUR_DIFFICULTY,
      }
    : null;
