import { cluesFromDoc, compassFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import type { Difficulty, CluePlace, Place } from '@/types';

import { logChange } from '../changelog';
import { data, putPlace, removePlace } from '../data';

/** A place card: the common identity, plus each game's data when this place is in it
 * (either one can be absent). `key` is the short code the `places/{key}` documents are indexed by
 * (e.g. `"par"` for Paris) — opaque, so every log message below prints it ALONGSIDE the human
 * identity rather than instead of it. */
export type PlaceRow = {
  key: string;
  name: string;
  code: string;
  coordinates: { latitude: number; longitude: number };
  compass: Place | null;
  clues: CluePlace | null;
};

type CluesDocOf = PlaceDoc & { clues: NonNullable<PlaceDoc['clues']> };
type CompassDocOf = PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> };

const compassOf = (doc: PlaceDoc): Place | null => (doc.compass ? compassFromDoc(doc as CompassDocOf) : null);

const cluesOf = (key: string, doc: PlaceDoc): CluePlace | null =>
  doc.clues ? cluesFromDoc(key, doc as CluesDocOf, { countries: data().countries, jobs: data().jobs }) : null;

const rowOf = (key: string, doc: PlaceDoc): PlaceRow => ({
  key,
  name: doc.name,
  code: doc.code,
  coordinates: { latitude: doc.latitude, longitude: doc.longitude },
  compass: compassOf(doc),
  clues: cluesOf(key, doc),
});

/** Reads the in-memory copy of Firestore (see `data.ts`): kept `async` so call sites don't care. */
export const fetchPlaces = async (): Promise<PlaceRow[]> =>
  Object.entries(data().places)
    .map(([key, doc]) => rowOf(key, doc))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

/** Every Clues place, for the syllable list. */
export const cluePlaces = (): CluePlace[] =>
  Object.entries(data().places).flatMap(([key, doc]) => {
    const clues = cluesOf(key, doc);
    return clues ? [clues] : [];
  });

export type CompassPatch = Partial<Pick<Place, 'category' | 'description'>>;
// Position/elevation/timezone/airport code/phone code/currency are all read-only in the admin:
// they come from real-world data (geography, IANA zones, ISO codes), not editorial judgment like
// category/difficulty/description — editing them here would be too easy to get subtly wrong.
export type CluesPatch = Partial<Pick<CluePlace, 'population' | 'climateEmoji' | 'emojis'>>;

const fmt = (value: unknown): string => (Array.isArray(value) ? value.join(' ') : String(value ?? '(vide)'));

const identity = (row: Pick<PlaceRow, 'name' | 'code' | 'key'>): string => `${row.name} (${row.code}) [${row.key}]`;

export const saveCompass = async (row: PlaceRow, patch: CompassPatch): Promise<Place> => {
  const current = row.compass!;
  const doc = data().places[row.key];
  const compass = { ...doc.compass!, ...patch };
  if (!compass.description) delete compass.description;
  const next = { ...doc, compass };
  await putPlace(row.key, next);
  for (const key of Object.keys(patch) as (keyof CompassPatch)[]) {
    logChange(`[Compass] ${identity(row)} — ${key} : ${fmt(current[key])} -> ${fmt(patch[key])}`);
  }
  return compassOf(next)!;
};

export const saveClues = async (row: PlaceRow, patch: CluesPatch): Promise<CluePlace> => {
  const current = row.clues!;
  const doc = data().places[row.key];
  const { emojis, ...rest } = patch;
  const next = { ...doc, clues: { ...doc.clues!, ...rest, ...(emojis && { emojis: [...emojis] }) } };
  await putPlace(row.key, next);
  for (const key of Object.keys(patch) as (keyof CluesPatch)[]) {
    logChange(`[Clues] ${identity(row)} — ${key} : ${fmt(current[key])} -> ${fmt(patch[key])}`);
  }
  return cluesOf(row.key, next)!;
};

/** Difficulty is shared between the two games, so it's logged once at the place level rather than
 * once per game. */
export const saveDifficulty = async (row: PlaceRow, difficulty: Difficulty): Promise<{ compass: Place | null; clues: CluePlace | null }> => {
  const current = (row.compass ?? row.clues)!.difficulty;
  const next = { ...data().places[row.key], difficulty };
  await putPlace(row.key, next);
  logChange(`[Difficulté] ${identity(row)} — ${current} -> ${difficulty}`);
  return { compass: compassOf(next), clues: cluesOf(row.key, next) };
};

export const deletePlace = async (row: PlaceRow): Promise<void> => {
  await removePlace(row.key);
  logChange(`[Suppression] ${identity(row)}`);
};
