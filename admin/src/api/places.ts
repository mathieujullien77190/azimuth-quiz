import { decodeAllPlaces } from '@/data/places/codec';
import type { Difficulty, CluePlace, Place } from '@/types';

import { logChange } from '../changelog';

/** A place card: the common identity, plus each game's data when this place is in it
 * (either one can be absent — see `codec.ts`). `key` is the short code the 5 place files are
 * indexed by (e.g. `"par"` for Paris) — opaque, so every log message below prints it ALONGSIDE
 * the human identity rather than instead of it. */
export type PlaceRow = {
  key: string;
  name: string;
  code: string;
  coordinates: { latitude: number; longitude: number };
  compass: Place | null;
  clues: CluePlace | null;
};

/** Reads the bundled place files (no network, no backend — see changelog.ts): kept `async` so
 * call sites reading it don't need to change just because this no longer fetches anything. */
export const fetchPlaces = async (): Promise<PlaceRow[]> =>
  decodeAllPlaces().map(({ key, common, compass, clues }) => ({
    key,
    name: common[0],
    code: common[1],
    coordinates: { latitude: common[2], longitude: common[3] },
    compass,
    clues,
  }));

export type CompassPatch = Partial<Pick<Place, 'category' | 'description'>>;
// Position/elevation/timezone/airport code/phone code/currency are all read-only in the admin:
// they come from real-world data (geography, IANA zones, ISO codes), not editorial judgment like
// category/difficulty/description — editing them here would be too easy to get subtly wrong.
export type CluesPatch = Partial<Pick<CluePlace, 'population' | 'climateEmoji' | 'emojis'>>;

const fmt = (value: unknown): string => (Array.isArray(value) ? value.join(' ') : String(value ?? '(vide)'));

const identity = (row: Pick<PlaceRow, 'name' | 'code' | 'key'>): string => `${row.name} (${row.code}) [${row.key}]`;

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
