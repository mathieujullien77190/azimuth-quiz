import { decodeCluePlaces } from '@/data/places/codec';
import type { CluePlace } from '@/types';

// Clues game: dedicated places, unrelated to data/places/ (Compass) except that the
// starting data (name/country/coordinates/difficulty) was imported from CITIES over there, then
// augmented here with fields specific to Clues (position, population, climate, elevation,
// timezone). Flag colors, country name and the currency's generic name are shared
// with Compass (see data/places/countries.ts): a country has only one flag and one
// currency, that's nothing Clues-specific.

/**
 * Each Clues place is rebuilt from the shared place files (see `src/data/places/codec.ts`):
 * `decodeCluePlaces` pairs each common place with its Clues-specific fields (population, climate,
 * elevation...). The two place pools stay independent (different curation, size and criteria),
 * only the identity (name/country/coordinates) and — for places present in both games — the raw
 * fields are shared. The game itself no longer reads this list (its places come from Firestore, see
 * `games/clues/helpers/firestoreCluePlaces.ts`): it only remains the bundled copy the stories use.
 */
export const CLUE_PLACES: CluePlace[] = decodeCluePlaces();
