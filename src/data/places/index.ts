import type { Place } from '@/types';

import { decodeCompassPlaces } from './codec';

/** Single source of places: split across `places.json`/`compassPlaces.json`/... (shared with
 * Clues, see `codec.ts`), editable by hand or via `npm run admin`. */
export const PLACES: Place[] = decodeCompassPlaces();
