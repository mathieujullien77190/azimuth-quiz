import type { Place } from '@/types';

import type { CompassDoc, PlaceDoc } from './types';

export const placeFromDoc = (doc: PlaceDoc & { compass: CompassDoc }, key?: string): Place => ({
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
