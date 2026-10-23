import { MIN_DISTANCE_KM } from '@/games/constants';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Arrondit a un pas lisible (plus grand pour les grandes distances) ; c'est aussi la precision atteignable
 * par le curseur, reprise par `scoreRound` pour la reponse exacte.
 */
export const roundDistance = (km: number, maxKm: number): number => {
  const step = km < 100 ? 5 : km < 1000 ? 10 : km < 10000 ? 50 : 100;
  return Math.min(maxKm, Math.max(MIN_DISTANCE_KM, Math.round(km / step) * step));
};

/**
 * Position [0, 1] sur le curseur logarithmique -> km. Pas d'arrondi aux extremes : le maximum doit rester
 * atteignable.
 */
export const ratioToKm = (ratio: number, maxKm: number): number => {
  const clamped = clamp01(ratio);
  if (clamped >= 1) return maxKm;
  if (clamped <= 0) return MIN_DISTANCE_KM;
  return roundDistance(MIN_DISTANCE_KM * Math.exp(Math.log(maxKm / MIN_DISTANCE_KM) * clamped), maxKm);
};

/** km -> position [0, 1] sur le curseur logarithmique. */
export const kmToRatio = (km: number, maxKm: number): number =>
  clamp01(Math.log(km / MIN_DISTANCE_KM) / Math.log(maxKm / MIN_DISTANCE_KM));
