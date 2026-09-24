import type { Place } from '@/types';

import { decodeBoussolePlaces, type MergedPlaces } from './codec';
import placesData from './places.json';

/** Source unique des lieux : `places.json` (partage avec Indices, voir `codec.ts`), editable a la
 * main ou via `npm run admin`. */
export const PLACES: Place[] = decodeBoussolePlaces(placesData as unknown as MergedPlaces);
