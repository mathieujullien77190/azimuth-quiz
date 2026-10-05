import type { CluePlace, Place } from '@/types';

import { cluesCategory } from './numbering';
import type { CompassDoc, PlaceDoc } from './types';

/** `Place` (Compass) from its document. */
export const compassFromDoc = (doc: PlaceDoc & { compass: CompassDoc }, key?: string): Place => ({
  ...(key !== undefined && { key }),
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
 * flag colors, currency, phone code) is the copy the place carries (`doc.country`), the personality carries its
 * job label. */
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
    ...(wordplay && { wordplay: { sentence: wordplay.sentence, difficulty: wordplay.difficulty } }),
    ...(personality && { personality: { name: personality.name, description: jobLabel ?? null } }),
  };
};
