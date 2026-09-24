import type { Place } from '@/types';

import { decodeBoussolePlaces, type MergedPlaces } from './codec';
import placesData from './places.json';

/** Single source of places: `places.json` (shared with Indices, see `codec.ts`), editable by
 * hand or via `npm run admin`. */
export const PLACES: Place[] = decodeBoussolePlaces(placesData as unknown as MergedPlaces);
