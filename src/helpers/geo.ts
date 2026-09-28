import { EARTH_RADIUS_KM } from '@/data';
import type { Coordinates } from '@/types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Great-circle distance in km (haversine formula). */
export const distanceKm = (from: Coordinates, to: Coordinates): number => {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Initial heading from `from` to `to`, in degrees [0, 360[ (0 = north, 90 = east). */
export const bearingDeg = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeBearing(toDegrees(Math.atan2(y, x)));
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
