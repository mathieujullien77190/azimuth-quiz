import { EARTH_RADIUS_KM } from '@/constants';
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

/** Central angle of the Earth between two points, in degrees [0, 180]. */
export const centralAngleDeg = (from: Coordinates, to: Coordinates): number =>
  toDegrees(distanceKm(from, to) / EARTH_RADIUS_KM);

/** Straight-line distance through the Earth (chord), in km. */
export const straightDistanceKm = (from: Coordinates, to: Coordinates): number =>
  2 * EARTH_RADIUS_KM * Math.sin(toRadians(centralAngleDeg(from, to)) / 2);

/**
 * Angle below the local horizon to aim at `to` in a straight line, in degrees [0, 90].
 * The chord makes an angle with the tangent equal to half the central angle.
 */
export const inclinationDeg = (from: Coordinates, to: Coordinates): number => centralAngleDeg(from, to) / 2;

/** Inclination (degrees below the horizon) of a straight line of length `chordKm`: the chord equals 2R sin(inclination). */
export const inclinationFromChordKm = (chordKm: number): number =>
  toDegrees(Math.asin(Math.min(1, Math.max(0, chordKm / (2 * EARTH_RADIUS_KM)))));

/**
 * Surface distance corresponding to an inclination: the central angle equals twice
 * the inclination (see inclinationDeg), the arc then measures R x that angle. Purely
 * indicative: the straight line and the arc share the same destination, only the inclination is chosen.
 */
export const arcKmFromInclination = (inclinationDeg: number): number => EARTH_RADIUS_KM * toRadians(2 * inclinationDeg);

/** Same thing directly from a chord length (straight line). */
export const arcKmFromChordKm = (chordKm: number): number => arcKmFromInclination(inclinationFromChordKm(chordKm));

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
