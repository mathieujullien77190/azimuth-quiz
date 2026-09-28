import { PLACES } from '@/data';
import type { ContourCountry, Difficulty, Place } from '@/types';

import { MAX_CITY_HINTS } from '../constants';

/** A place offered as a hint: where it is and what it is called (places have a single name, in French
 * for the French data, whatever the player's language). */
export type ContourPlace = { name: string; longitude: number; latitude: number };

/** What a country can offer as city/capital hints: a country without any (or whose places all lie
 * outside its main ring) simply has none, and the matching hint steps are left out of its plan. */
export type ContourPlaces = { capital: ContourPlace | null; cities: ContourPlace[] };

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, intermediate: 1, hard: 2 };

const toContourPlace = (place: Place): ContourPlace => ({
  name: place.name,
  longitude: place.coordinates.longitude,
  latitude: place.coordinates.latitude,
});

/**
 * The capital and the cities (capital excluded, at most `MAX_CITY_HINTS`) of `country`, from the
 * game's own places (`PLACES`: the categories `capital`, `cities` and `citiesFr`). Only the places
 * inside the bounding box of the country's main ring are kept, which leaves out overseas territories
 * (the board is framed on that ring). The choice is deterministic, so every device draws the same
 * ones: the best-known cities first (easy, then intermediate, then hard), ties in data order.
 */
export const contourPlacesFor = (country: ContourCountry, places: readonly Place[] = PLACES): ContourPlaces => {
  const lons = country.points.map((point) => point[0]);
  const lats = country.points.map((point) => point[1]);
  const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];

  const inside = places.filter(
    (place) =>
      place.code === country.code &&
      place.coordinates.longitude >= minLon &&
      place.coordinates.longitude <= maxLon &&
      place.coordinates.latitude >= minLat &&
      place.coordinates.latitude <= maxLat,
  );

  const capital = inside.find((place) => place.category === 'capital');
  const seen = new Set<string>(capital ? [capital.name] : []);
  const cities = inside
    .filter((place) => place.category === 'cities' || place.category === 'citiesFr')
    .filter((place) => !seen.has(place.name) && seen.add(place.name))
    .sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty])
    .slice(0, MAX_CITY_HINTS)
    .map(toContourPlace);

  return { capital: capital ? toContourPlace(capital) : null, cities };
};
