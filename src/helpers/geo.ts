import { CARDINAL_LABELS, EARTH_RADIUS_KM } from '@/constants';
import type { Coordinates } from '@/types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Distance grand cercle en km (formule de haversine). */
export const distanceKm = (from: Coordinates, to: Coordinates): number => {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

/** Angle au centre de la Terre entre deux points, en degres [0, 180]. */
export const centralAngleDeg = (from: Coordinates, to: Coordinates): number =>
  toDegrees(distanceKm(from, to) / EARTH_RADIUS_KM);

/** Distance en ligne droite a travers la Terre (corde), en km. */
export const straightDistanceKm = (from: Coordinates, to: Coordinates): number =>
  2 * EARTH_RADIUS_KM * Math.sin(toRadians(centralAngleDeg(from, to)) / 2);

/**
 * Angle sous l'horizon local pour viser `to` en ligne droite, en degres [0, 90].
 * La corde fait avec la tangente un angle egal a la moitie de l'angle au centre.
 */
export const inclinationDeg = (from: Coordinates, to: Coordinates): number => centralAngleDeg(from, to) / 2;

/** Inclinaison (degres sous l'horizon) d'une ligne droite de longueur `chordKm` : la corde vaut 2R sin(inclinaison). */
export const inclinationFromChordKm = (chordKm: number): number =>
  toDegrees(Math.asin(Math.min(1, Math.max(0, chordKm / (2 * EARTH_RADIUS_KM)))));

/**
 * Distance de surface correspondant a une inclinaison : l'angle au centre vaut deux fois
 * l'inclinaison (voir inclinationDeg), l'arc mesure alors R x cet angle. Purement indicatif :
 * la ligne droite et l'arc partagent la meme destination, seule l'inclinaison est choisie.
 */
export const arcKmFromInclination = (inclinationDeg: number): number =>
  EARTH_RADIUS_KM * toRadians(2 * inclinationDeg);

/** Meme chose directement depuis une longueur de corde (ligne droite). */
export const arcKmFromChordKm = (chordKm: number): number => arcKmFromInclination(inclinationFromChordKm(chordKm));

/** Cap initial de `from` vers `to`, en degres [0, 360[ (0 = nord, 90 = est). */
export const bearingDeg = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeBearing(toDegrees(Math.atan2(y, x)));
};

export const normalizeBearing = (degrees: number): number => ((degrees % 360) + 360) % 360;

/** Ecart angulaire le plus court entre deux caps, dans [0, 180]. */
export const angleDifference = (a: number, b: number): number => {
  const diff = Math.abs(normalizeBearing(a) - normalizeBearing(b));
  return diff > 180 ? 360 - diff : diff;
};

/** Point cardinal (N, NE, E...) le plus proche d'un cap. */
export const bearingToCardinal = (degrees: number): string => {
  const index = Math.round(normalizeBearing(degrees) / 45) % CARDINAL_LABELS.length;
  return CARDINAL_LABELS[index];
};
