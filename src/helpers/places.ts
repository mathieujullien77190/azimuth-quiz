import {
  EUROPE_CODES,
  EUROPE_MAX_LONGITUDE,
  EUROPE_MIN_LATITUDE,
  MIN_PLACE_DISTANCE_KM,
  PLACES,
} from '@/constants';
import type { Category, Coordinates, GameSettings, Place, Zone } from '@/types';

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

/** Lieux d'une partie : bonnes categories, dans la zone choisie. */
export const filterPlaces = (categories: Category[], zone: Zone): Place[] =>
  PLACES.filter((place) => categories.includes(place.category) && isInZone(place, zone));

/**
 * Tire les lieux de la partie, en evitant ceux trop proches du point de depart
 * (sauf s'il n'en reste aucun : mieux vaut un lieu proche que pas de partie).
 */
export const pickPlaces = (origin: Coordinates, settings: GameSettings): Place[] => {
  const candidates = filterPlaces(settings.categories, settings.zone);
  const far = candidates.filter((place) => distanceKm(origin, place.coordinates) >= MIN_PLACE_DISTANCE_KM);
  return shuffle(far.length > 0 ? far : candidates).slice(0, settings.rounds);
};
