import { decodeBoussolePlace, decodeIndicesPlace, type MergedPlaces } from '@/constants/places/codec';
import placesData from '@/constants/places/places.json';
import type { Difficulty, IndicesPlace, Place } from '@/types';

import { logChange } from '../changelog';

/** A place card: the common identity, plus each game's data when this place is in it
 * (either one can be absent — see `codec.ts`). */
export type PlaceRow = {
  index: number;
  name: string;
  code: string;
  coordinates: { latitude: number; longitude: number };
  boussole: Place | null;
  indices: IndicesPlace | null;
};

const ENTRIES = placesData as unknown as MergedPlaces;

/** Reads the bundled `places.json` (no network, no backend — see changelog.ts): kept `async` so
 * call sites reading it don't need to change just because this no longer fetches anything. */
export const fetchPlaces = async (): Promise<PlaceRow[]> =>
  ENTRIES.map(([common, boussoleRow, indicesRow], index) => ({
    index,
    name: common[0],
    code: common[1],
    coordinates: { latitude: common[2], longitude: common[3] },
    boussole: boussoleRow ? decodeBoussolePlace(common, boussoleRow) : null,
    indices: indicesRow ? decodeIndicesPlace(common, indicesRow) : null,
  }));

export type BoussolePatch = Partial<Pick<Place, 'category' | 'description'>>;
// Position/elevation/timezone/airport code/phone code/currency are all read-only in the admin:
// they come from real-world data (geography, IANA zones, ISO codes), not editorial judgment like
// category/difficulty/description — editing them here would be too easy to get subtly wrong.
export type IndicesPatch = Partial<Pick<IndicesPlace, 'population' | 'climateEmoji' | 'emojis'>>;

const fmt = (value: unknown): string => (Array.isArray(value) ? value.join(' ') : String(value ?? '(vide)'));

const identity = (row: Pick<PlaceRow, 'name' | 'code'>): string => `${row.name} (${row.code})`;

export const saveBoussole = async (row: PlaceRow, patch: BoussolePatch): Promise<Place> => {
  const current = row.boussole!;
  for (const key of Object.keys(patch) as (keyof BoussolePatch)[]) {
    logChange(`[Boussole] ${identity(row)} — ${key} : ${fmt(current[key])} -> ${fmt(patch[key])}`);
  }
  return { ...current, ...patch };
};

export const saveIndices = async (row: PlaceRow, patch: IndicesPatch): Promise<IndicesPlace> => {
  const current = row.indices!;
  for (const key of Object.keys(patch) as (keyof IndicesPatch)[]) {
    logChange(`[Indices] ${identity(row)} — ${key} : ${fmt(current[key])} -> ${fmt(patch[key])}`);
  }
  return { ...current, ...patch };
};

/** Difficulty is shared between the two games (see `codec.ts`), so it's logged once at the
 * place level rather than once per game. */
export const saveDifficulty = (row: PlaceRow, difficulty: Difficulty): Promise<{ boussole: Place | null; indices: IndicesPlace | null }> => {
  const current = (row.boussole ?? row.indices)!.difficulty;
  logChange(`[Difficulté] ${identity(row)} — ${current} -> ${difficulty}`);
  return Promise.resolve({
    boussole: row.boussole && { ...row.boussole, difficulty },
    indices: row.indices && { ...row.indices, difficulty },
  });
};

export const deletePlace = async (row: PlaceRow): Promise<void> => {
  logChange(`[Suppression] ${identity(row)}`);
};
