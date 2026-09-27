import type { Place } from '@/types';

import { decodeCompassPlaces, type MergedPlaces } from './codec';
import placesData from './places.json';

/** Single source of places: `places.json` (shared with Clues, see `codec.ts`), editable by
 * hand or via `npm run admin`. */
export const PLACES: Place[] = decodeCompassPlaces(placesData as unknown as MergedPlaces);
