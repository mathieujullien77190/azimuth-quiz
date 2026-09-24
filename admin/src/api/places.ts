import { decodeBoussolePlace, decodeIndicesPlace, type MergedPlaces } from '@/constants/places/codec';
import type { IndicesPlace, Place } from '@/types';

import { del, getJson, putJson } from './http';

/** Une carte lieu : l'identite commune, plus les donnees de chaque jeu quand ce lieu y figure
 * (l'un des deux peut etre absent — voir `codec.ts`). */
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

export type BoussolePatch = Partial<Pick<Place, 'category' | 'difficulty' | 'description'>>;
export type IndicesPatch = Partial<
  Pick<IndicesPlace, 'difficulty' | 'positionInCountry' | 'population' | 'climateEmoji' | 'elevationMeters' | 'timezone' | 'airportCode' | 'emojis'>
>;

export const saveBoussole = (index: number, patch: BoussolePatch): Promise<Place> => putJson(`/api/places/${index}`, { boussole: patch });

export const saveIndices = (index: number, patch: IndicesPatch): Promise<IndicesPlace> => putJson(`/api/places/${index}`, { indices: patch });

export const deletePlace = (index: number): Promise<void> => del(`/api/places/${index}`);
