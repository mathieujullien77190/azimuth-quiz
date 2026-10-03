import { EARTH_RADIUS_KM } from '@/data';
import type { Coordinates } from '@/types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * The game works with the rhumb line (loxodrome), not the great circle (orthodrome): the route you follow
 * by holding the SAME heading all the way, the one a compass gives. It is a bit longer than the great
 * circle (up to about 21 180 km on Earth, against 20 015 km) and its heading is a single value instead of
 * one that drifts as you go.
 *
 * Every formula below is the loxodrome one. They are short because a route of constant heading is a
 * straight line once latitudes are stretched the Mercator way.
 */
const stretchedLatitude = (latitude: number): number => Math.log(Math.tan(latitude / 2 + Math.PI / 4));

/** Below this difference of stretched latitudes the route is due east or west (same parallel). */
const SAME_PARALLEL_EPSILON = 1e-12;

/** A longitude brought back into [-180, 180[. */
export const wrapLongitude = (longitude: number): number => ((((longitude + 180) % 360) + 360) % 360) - 180;

/** How far east (> 0) or west (< 0) `to` is from `from`, the shorter way around, in degrees. */
const longitudeDifference = (from: Coordinates, to: Coordinates): number =>
  wrapLongitude(to.longitude - from.longitude);

/**
 * How much the Mercator stretching inflated the latitudes of the route: `distanceKm` and
 * `rhumbDestination` both need it to turn a difference of longitudes into a real distance. Due east or
 * west nothing moves in latitude, and the ratio is the cosine of the parallel being followed.
 */
const stretchRatio = (fromLatitude: number, latitudeDelta: number, stretchedDelta: number): number =>
  Math.abs(stretchedDelta) > SAME_PARALLEL_EPSILON ? latitudeDelta / stretchedDelta : Math.cos(fromLatitude);

/** Length in km of the constant-heading route from `from` to `to` (rhumb line, see above). */
export const distanceKm = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLat = lat2 - lat1;
  const dLon = toRadians(longitudeDifference(from, to));
  const q = stretchRatio(lat1, dLat, stretchedLatitude(lat2) - stretchedLatitude(lat1));
  return EARTH_RADIUS_KM * Math.hypot(dLat, q * dLon);
};

/** Heading from `from` to `to`, in degrees [0, 360[ (0 = north, 90 = east): the one to hold all the way. */
export const bearingDeg = (from: Coordinates, to: Coordinates): number => {
  const dLon = toRadians(longitudeDifference(from, to));
  const dStretched = stretchedLatitude(toRadians(to.latitude)) - stretchedLatitude(toRadians(from.latitude));
  return normalizeBearing(toDegrees(Math.atan2(dLon, dStretched)));
};

/** Where you end up after `km` on the constant heading `bearing` from `origin`: the other way round from
 * `bearingDeg`/`distanceKm`, to draw where an answer lands and the route it takes. */
export const rhumbDestination = (origin: Coordinates, bearing: number, km: number): Coordinates => {
  const angular = km / EARTH_RADIUS_KM;
  const theta = toRadians(bearing);
  const lat1 = toRadians(origin.latitude);
  // Holding a heading never takes you past a pole: the route winds tighter and tighter round it, so it stops there.
  const lat2 = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, lat1 + angular * Math.cos(theta)));
  const dLat = lat2 - lat1;
  const q = stretchRatio(lat1, dLat, stretchedLatitude(lat2) - stretchedLatitude(lat1));
  const lon2 = toRadians(origin.longitude) + (angular * Math.sin(theta)) / q;
  return { latitude: toDegrees(lat2), longitude: wrapLongitude(toDegrees(lon2)) };
};

export const normalizeBearing = (degrees: number): number => ((degrees % 360) + 360) % 360;

/** Shortest angular difference between two headings, in [0, 180]. */
export const angleDifference = (a: number, b: number): number => {
  const diff = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return diff > 180 ? 360 - diff : diff;
};

/** Cardinal point (N, NE, E...) closest to a heading, in the language of `labels`. */
export const bearingToCardinal = (degrees: number, labels: readonly string[]): string => {
  const index = Math.round(normalizeBearing(degrees) / 45) % labels.length;
  return labels[index];
};
