import { decodeBoussolePlace, decodeIndicesPlace, type MergedPlaces } from '@/constants/places/codec';
import type { Difficulty, IndicesPlace, Place } from '@/types';

import { del, getJson, putJson } from './http';

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

export const fetchPlaces = async (): Promise<PlaceRow[]> => {
  const entries = await getJson<MergedPlaces>('/api/places', 'Impossible de charger les lieux.');

  return entries.map(([common, boussoleRow, indicesRow], index) => ({
    index,
    name: common[0],
    code: common[1],
    coordinates: { latitude: common[2], longitude: common[3] },
    boussole: boussoleRow ? decodeBoussolePlace(common, boussoleRow) : null,
    indices: indicesRow ? decodeIndicesPlace(common, indicesRow) : null,
  }));
};

export type BoussolePatch = Partial<Pick<Place, 'category' | 'description'>>;
export type IndicesPatch = Partial<
  Pick<IndicesPlace, 'positionInCountry' | 'population' | 'climateEmoji' | 'elevationMeters' | 'timezone' | 'airportCode' | 'emojis'>
>;

export const saveBoussole = (index: number, patch: BoussolePatch): Promise<Place> => putJson(`/api/places/${index}`, { boussole: patch });

export const saveIndices = (index: number, patch: IndicesPatch): Promise<IndicesPlace> => putJson(`/api/places/${index}`, { indices: patch });

/** Difficulty is shared between the two games (see `codec.ts`), so it's patched at the place
 * level, not under `boussole`/`indices`: the response carries both decoded game views back so
 * the UI can update whichever of them are present without a separate round-trip. */
export const saveDifficulty = (index: number, difficulty: Difficulty): Promise<{ boussole: Place | null; indices: IndicesPlace | null }> =>
  putJson(`/api/places/${index}`, { common: { difficulty } });

export const deletePlace = (index: number): Promise<void> => del(`/api/places/${index}`);
