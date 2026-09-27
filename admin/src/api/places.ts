import { decodeCompassPlace, decodeCluePlace, type MergedPlaces } from '@/data/places/codec';
import placesData from '@/data/places/places.json';
import type { Difficulty, CluePlace, Place } from '@/types';

import { logChange } from '../changelog';

/** A place card: the common identity, plus each game's data when this place is in it
 * (either one can be absent — see `codec.ts`). */
export type PlaceRow = {
  index: number;
  name: string;
  code: string;
  coordinates: { latitude: number; longitude: number };
  compass: Place | null;
  clues: CluePlace | null;
};

const ENTRIES = placesData as unknown as MergedPlaces;

/** Reads the bundled `places.json` (no network, no backend — see changelog.ts): kept `async` so
 * call sites reading it don't need to change just because this no longer fetches anything. */
export const fetchPlaces = async (): Promise<PlaceRow[]> =>
  ENTRIES.map(([common, compassRow, cluesRow], index) => ({
    index,
    name: common[0],
    code: common[1],
    coordinates: { latitude: common[2], longitude: common[3] },
    compass: compassRow ? decodeCompassPlace(common, compassRow) : null,
    clues: cluesRow ? decodeCluePlace(common, cluesRow) : null,
  }));

export type CompassPatch = Partial<Pick<Place, 'category' | 'description'>>;
// Position/elevation/timezone/airport code/phone code/currency are all read-only in the admin:
// they come from real-world data (geography, IANA zones, ISO codes), not editorial judgment like
// category/difficulty/description — editing them here would be too easy to get subtly wrong.
export type CluesPatch = Partial<Pick<CluePlace, 'population' | 'climateEmoji' | 'emojis'>>;

const fmt = (value: unknown): string => (Array.isArray(value) ? value.join(' ') : String(value ?? '(vide)'));

const identity = (row: Pick<PlaceRow, 'name' | 'code'>): string => `${row.name} (${row.code})`;

export const saveCompass = async (row: PlaceRow, patch: CompassPatch): Promise<Place> => {
  const current = row.compass!;
  for (const key of Object.keys(patch) as (keyof CompassPatch)[]) {
    logChange(`[Compass] ${identity(row)} — ${key} : ${fmt(current[key])} -> ${fmt(patch[key])}`);
  }
  return { ...current, ...patch };
};

export const saveClues = async (row: PlaceRow, patch: CluesPatch): Promise<CluePlace> => {
  const current = row.clues!;
  for (const key of Object.keys(patch) as (keyof CluesPatch)[]) {
    logChange(`[Clues] ${identity(row)} — ${key} : ${fmt(current[key])} -> ${fmt(patch[key])}`);
  }
  return { ...current, ...patch };
};

/** Difficulty is shared between the two games (see `codec.ts`), so it's logged once at the
 * place level rather than once per game. */
export const saveDifficulty = (row: PlaceRow, difficulty: Difficulty): Promise<{ compass: Place | null; clues: CluePlace | null }> => {
  const current = (row.compass ?? row.clues)!.difficulty;
  logChange(`[Difficulté] ${identity(row)} — ${current} -> ${difficulty}`);
  return Promise.resolve({
    compass: row.compass && { ...row.compass, difficulty },
    clues: row.clues && { ...row.clues, difficulty },
  });
};

export const deletePlace = async (row: PlaceRow): Promise<void> => {
  logChange(`[Suppression] ${identity(row)}`);
};
