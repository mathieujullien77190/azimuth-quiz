import type { CluePlace, ContourCountry, ContourPlace, ContourRoundCountry, Place } from '@/types';

import { cluesCategory } from './numbering';
import { decodeRing } from './polyline';
import type { CompassDoc, ContourCountryDoc, ContourPlaceDoc, PlaceDoc } from './types';

/** `[lon, lat, lon, lat, ...]` back to `[[lon, lat], ...]` (Firestore has no nested arrays). */
export const unflattenPoints = (flat: readonly number[]): [number, number][] =>
  Array.from({ length: flat.length / 2 }, (_, index) => [flat[2 * index], flat[2 * index + 1]]);

/** `Place` (Compass) from its document. */
export const compassFromDoc = (doc: PlaceDoc & { compass: CompassDoc }): Place => ({
  name: doc.name,
  code: doc.code,
  category: doc.compass.category,
  difficulty: doc.difficulty,
  coordinates: { latitude: doc.latitude, longitude: doc.longitude },
  ...(doc.country && { country: { fr: doc.country.fr, en: doc.country.en } }),
  ...(doc.compass.description !== undefined && { description: doc.compass.description }),
  ...(doc.compass.wikiFr !== undefined && { wikiFr: doc.compass.wikiFr }),
  ...(doc.compass.wikiEn !== undefined && { wikiEn: doc.compass.wikiEn }),
});

/** `CluePlace` from its document — everything a round shows comes from the document itself: the country (name,
 * flag colors, currency, phone code) is the copy the place carries (`doc.country`), the riddles sit next to the
 * syllables, the personality carries its job label. */
export const cluesFromDoc = (key: string, doc: PlaceDoc & { clues: NonNullable<PlaceDoc['clues']> }): CluePlace => {
  const { country } = doc;
  const { personality, wordplay } = doc;
  const jobLabel = personality?.job?.fr;
  return {
    key,
    name: doc.name,
    code: doc.code,
    country: country?.fr ?? doc.code,
    coordinates: { latitude: doc.latitude, longitude: doc.longitude },
    difficulty: doc.difficulty,
    category: doc.clues.category ?? cluesCategory(doc),
    positionInCountry: doc.clues.positionInCountry,
    population: doc.clues.population,
    climateEmoji: doc.clues.climateEmoji,
    elevationMeters: doc.clues.elevationMeters,
    timezone: doc.clues.timezone,
    phoneCode: country?.phoneCode ?? '',
    currency: country?.currencySymbol ?? '',
    currencyName: country?.currency ?? '',
    flagColors: (country?.flag ?? []).map(({ id, hex, percent }) => ({ id, hex, percent })),
    airportCode: doc.clues.airportCode,
    emojis: doc.clues.emojis as unknown as CluePlace['emojis'],
    syllables: [...doc.clues.syllables],
    riddles: doc.clues.syllables.map((_, index) => doc.clues.riddles?.[index] ?? null),
    ...(wordplay && { wordplay: { sentence: wordplay.sentence, difficulty: wordplay.difficulty } }),
    ...(personality && { personality: { name: personality.name, description: jobLabel ?? null } }),
  };
};

/** `ContourCountry` (what the board draws) from a `contours/{code}` document. */
export const contourFromDoc = (code: string, doc: ContourCountryDoc): ContourCountry => ({
  code,
  // The encoded ring when the document has one, else the flat points (not migrated yet).
  points: doc.ring === undefined ? unflattenPoints(doc.points) : decodeRing(doc.ring),
  neighbors: doc.neighbors,
  centerLabel: doc.centerLabel,
  difficulty: doc.difficulty,
});

const contourPlaceFromDoc = ({ name, lon, lat }: ContourPlaceDoc): ContourPlace => ({
  name,
  longitude: lon,
  latitude: lat,
});

/** What a Silhouette round needs about its country (`ContourRoundCountry`) from its `contours/{code}`
 * document: names, capital and cities are in it, nothing is looked up elsewhere. */
export const roundCountryFromDoc = (code: string, doc: ContourCountryDoc): ContourRoundCountry => ({
  ...contourFromDoc(code, doc),
  fr: doc.fr,
  en: doc.en,
  neighbors: doc.neighbors,
  capital: doc.capital ? contourPlaceFromDoc(doc.capital) : null,
  cities: (doc.cities ?? []).map(contourPlaceFromDoc),
});
