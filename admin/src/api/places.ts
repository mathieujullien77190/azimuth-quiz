import { compassFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import type { Difficulty, Place } from '@/types';

import { applyPlaceChange, data } from '../data';

/** Fiche d'un lieu : son identite plus ses donnees Boussole (absentes si le lieu n'en a pas). */
export type PlaceRow = {
  key: string;
  name: string;
  code: string;
  /** Nom francais du pays tel que le lieu le porte (son code a defaut). */
  country: string;
  coordinates: { latitude: number; longitude: number };
  compass: Place | null;
};

type CompassDocOf = PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> };

const compassOf = (doc: PlaceDoc): Place | null => (doc.compass ? compassFromDoc(doc as CompassDocOf) : null);

const rowOf = (key: string, doc: PlaceDoc): PlaceRow => ({
  key,
  name: doc.name,
  code: doc.code,
  country: doc.country?.fr ?? doc.code,
  coordinates: { latitude: doc.latitude, longitude: doc.longitude },
  compass: compassOf(doc),
});

/** Lit la copie en memoire de Firestore (voir `data.ts`) ; `async` pour que les appelants n'en dependent pas. */
export const fetchPlaces = async (): Promise<PlaceRow[]> =>
  Object.entries(data().places)
    .map(([key, doc]) => rowOf(key, doc))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export type CompassPatch = Partial<Pick<Place, 'category' | 'description'>>;

export const saveCompass = async (row: PlaceRow, patch: CompassPatch): Promise<Place> => {
  const doc = data().places[row.key];
  const compass = { ...doc.compass!, ...patch };
  if (!compass.description) delete compass.description;
  const next = { ...doc, compass };
  await applyPlaceChange(row.key, next);
  return compassOf(next)!;
};

/** La difficulte est stockee une fois au niveau du lieu. */
export const saveDifficulty = async (
  row: PlaceRow,
  difficulty: Difficulty,
): Promise<Place | null> => {
  const next = { ...data().places[row.key], difficulty };
  await applyPlaceChange(row.key, next);
  return compassOf(next);
};

export const deletePlace = async (row: PlaceRow): Promise<void> => {
  await applyPlaceChange(row.key, null);
};
