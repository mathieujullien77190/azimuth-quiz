import { EARTH_RADIUS_KM } from '@/data';
import type { Coordinates } from '@/types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * Loxodromie (cap constant, celui d'une boussole), pas orthodromie : un peu plus longue (jusqu'a ~21 180 km
 * contre 20 015 km). C'est une droite une fois les latitudes etirees facon Mercator.
 */
const stretchedLatitude = (latitude: number): number => Math.log(Math.tan(latitude / 2 + Math.PI / 4));

/** Sous cet ecart de latitudes etirees, la route est plein est/ouest (meme parallele). */
const SAME_PARALLEL_EPSILON = 1e-12;

/** Longitude ramenee dans [-180, 180[. */
export const wrapLongitude = (longitude: number): number => ((((longitude + 180) % 360) + 360) % 360) - 180;

/** Ecart en degres vers l'est (> 0) ou l'ouest (< 0), par le chemin le plus court. */
const longitudeDifference = (from: Coordinates, to: Coordinates): number =>
  wrapLongitude(to.longitude - from.longitude);

/** Facteur pour convertir un ecart de longitudes en distance reelle ; plein est/ouest, c'est le cosinus du parallele. */
const stretchRatio = (fromLatitude: number, latitudeDelta: number, stretchedDelta: number): number =>
  Math.abs(stretchedDelta) > SAME_PARALLEL_EPSILON ? latitudeDelta / stretchedDelta : Math.cos(fromLatitude);

/** Longueur en km de la route a cap constant (loxodromie). */
export const distanceKm = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLat = lat2 - lat1;
  const dLon = toRadians(longitudeDifference(from, to));
  const q = stretchRatio(lat1, dLat, stretchedLatitude(lat2) - stretchedLatitude(lat1));
  return EARTH_RADIUS_KM * Math.hypot(dLat, q * dLon);
};

/** Cap en degres [0, 360[ (0 = nord, 90 = est) a tenir tout le long. */
export const bearingDeg = (from: Coordinates, to: Coordinates): number => {
  const dLon = toRadians(longitudeDifference(from, to));
  const dStretched = stretchedLatitude(toRadians(to.latitude)) - stretchedLatitude(toRadians(from.latitude));
  return normalizeBearing(toDegrees(Math.atan2(dLon, dStretched)));
};

/** Point d'arrivee apres `km` au cap `bearing` : l'inverse de `bearingDeg`/`distanceKm`. */
export const rhumbDestination = (origin: Coordinates, bearing: number, km: number): Coordinates => {
  const angular = km / EARTH_RADIUS_KM;
  const theta = toRadians(bearing);
  const lat1 = toRadians(origin.latitude);
  // Un cap tenu ne depasse jamais un pole (la route s'y enroule) : on borne la latitude.
  const lat2 = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, lat1 + angular * Math.cos(theta)));
  const dLat = lat2 - lat1;
  const q = stretchRatio(lat1, dLat, stretchedLatitude(lat2) - stretchedLatitude(lat1));
  const lon2 = toRadians(origin.longitude) + (angular * Math.sin(theta)) / q;
  return { latitude: toDegrees(lat2), longitude: wrapLongitude(toDegrees(lon2)) };
};

export const normalizeBearing = (degrees: number): number => ((degrees % 360) + 360) % 360;

/** Plus petit ecart angulaire entre deux caps, dans [0, 180]. */
export const angleDifference = (a: number, b: number): number => {
  const diff = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return diff > 180 ? 360 - diff : diff;
};

/** Point cardinal (N, NE, E...) le plus proche d'un cap, dans la langue de `labels`. */
export const bearingToCardinal = (degrees: number, labels: readonly string[]): string => {
  const index = Math.round(normalizeBearing(degrees) / 45) % labels.length;
  return labels[index];
};
