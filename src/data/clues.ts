import { decodeCompassPlaces, decodeCluePlaces } from '@/data/places/codec';
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
 * fields are shared.
 */
export const CLUE_PLACES: CluePlace[] = decodeCluePlaces();

// "Is this a capital?" isn't Clues' own data: it's Compass's "capital" category (see
// data/places/codec.ts), which only exists on places in the Compass pool. Cross-referenced
// here by (name, country code) rather than duplicated as its own field on every Clues place.
const COMPASS_PLACES = decodeCompassPlaces();

const CAPITAL_KEYS = new Set(
  COMPASS_PLACES.filter((place) => place.category === 'capital').map((place) => `${place.name}|${place.code}`),
);

export const isCapitalPlace = (place: Pick<CluePlace, 'name' | 'code'>): boolean => CAPITAL_KEYS.has(`${place.name}|${place.code}`);

// Same cross-reference as CAPITAL_KEYS, for Compass's "citiesFr" category.
const FRENCH_CITY_KEYS = new Set(
  COMPASS_PLACES.filter((place) => place.category === 'citiesFr').map((place) => `${place.name}|${place.code}`),
);

export const isFrenchCityPlace = (place: Pick<CluePlace, 'name' | 'code'>): boolean => FRENCH_CITY_KEYS.has(`${place.name}|${place.code}`);
