import { cluesFromDoc, compassFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import type { Difficulty, CluePlace, Place } from '@/types';

import { applyPlaceChange, data, putPlace } from '../data';

/** Fiche d'un lieu : l'identite commune plus les donnees de chaque jeu auquel il appartient. */
export type PlaceRow = {
  key: string;
  name: string;
  code: string;
  /** Nom francais du pays tel que le lieu le porte (son code a defaut). */
  country: string;
  coordinates: { latitude: number; longitude: number };
  compass: Place | null;
  clues: CluePlace | null;
};

type CluesDocOf = PlaceDoc & { clues: NonNullable<PlaceDoc['clues']> };
type CompassDocOf = PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> };

const compassOf = (doc: PlaceDoc): Place | null => (doc.compass ? compassFromDoc(doc as CompassDocOf) : null);

const cluesOf = (key: string, doc: PlaceDoc): CluePlace | null =>
  doc.clues ? cluesFromDoc(key, doc as CluesDocOf) : null;

const rowOf = (key: string, doc: PlaceDoc): PlaceRow => ({
  key,
  name: doc.name,
  code: doc.code,
  country: doc.country?.fr ?? doc.code,
  coordinates: { latitude: doc.latitude, longitude: doc.longitude },
  compass: compassOf(doc),
  clues: cluesOf(key, doc),
});

/** Lit la copie en memoire de Firestore (voir `data.ts`) ; `async` pour que les appelants n'en dependent pas. */
export const fetchPlaces = async (): Promise<PlaceRow[]> =>
  Object.entries(data().places)
    .map(([key, doc]) => rowOf(key, doc))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export type CompassPatch = Partial<Pick<Place, 'category' | 'description'>>;
// Position, altitude, fuseau, aeroport, indicatifs, devise : lecture seule dans l'admin, ce sont des donnees du monde
// reel (geographie, IANA, ISO) et pas du jugement editorial ; les editer ici serait trop facile a rater.
export type CluesPatch = Partial<Pick<CluePlace, 'population' | 'climateEmoji' | 'emojis'>>;

export const saveCompass = async (row: PlaceRow, patch: CompassPatch): Promise<Place> => {
  const doc = data().places[row.key];
  const compass = { ...doc.compass!, ...patch };
  if (!compass.description) delete compass.description;
  const next = { ...doc, compass };
  await applyPlaceChange(row.key, next);
  return compassOf(next)!;
};

export const saveClues = async (row: PlaceRow, patch: CluesPatch): Promise<CluePlace> => {
  const doc = data().places[row.key];
  const { emojis, ...rest } = patch;
  const next = { ...doc, clues: { ...doc.clues!, ...rest, ...(emojis && { emojis: [...emojis] }) } };
  await putPlace(row.key, next);
  return cluesOf(row.key, next)!;
};

/** La difficulte est commune aux deux jeux : stockee une fois au niveau du lieu. */
export const saveDifficulty = async (
  row: PlaceRow,
  difficulty: Difficulty,
): Promise<{ compass: Place | null; clues: CluePlace | null }> => {
  const next = { ...data().places[row.key], difficulty };
  await applyPlaceChange(row.key, next);
  return { compass: compassOf(next), clues: cluesOf(row.key, next) };
};

export const deletePlace = async (row: PlaceRow): Promise<void> => {
  await applyPlaceChange(row.key, null);
};
