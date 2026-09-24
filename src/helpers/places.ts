import { EUROPE_CODES, EUROPE_MAX_LONGITUDE, EUROPE_MIN_LATITUDE, MIN_PLACE_DISTANCE_KM, PLACES } from '@/constants';
import type { Category, Coordinates, Difficulty, GameSettings, Place, Zone } from '@/types';

import { distanceKm } from './geo';
import { shuffle } from './random';

const isInZone = (place: Place, zone: Zone): boolean => {
  if (zone === 'france') return place.code === 'FR';
  if (zone === 'europe') {
    const { latitude, longitude } = place.coordinates;
    return EUROPE_CODES.includes(place.code) && longitude <= EUROPE_MAX_LONGITUDE && latitude >= EUROPE_MIN_LATITUDE;
  }
  return true;
};

/** Places for a game: matching categories, matching difficulties, within the chosen zone. */
export const filterPlaces = (categories: Category[], difficulties: Difficulty[], zone: Zone): Place[] =>
  PLACES.filter(
    (place) => categories.includes(place.category) && difficulties.includes(place.difficulty) && isInZone(place, zone),
  );

/**
 * Draws the game's places, avoiding ones too close to the starting point
 * (unless none are left: better a nearby place than no game at all).
 */
export const pickPlaces = (origin: Coordinates, settings: GameSettings): Place[] => {
  const candidates = filterPlaces(settings.categories, settings.difficulties, settings.zone);
  const far = candidates.filter((place) => distanceKm(origin, place.coordinates) >= MIN_PLACE_DISTANCE_KM);
  return shuffle(far.length > 0 ? far : candidates).slice(0, settings.rounds);
};
