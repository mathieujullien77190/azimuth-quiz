import { MIN_DISTANCE_KM } from '@/constants';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Arrondit a un pas lisible : plus la distance est grande, plus le pas l'est. */
const roundDistance = (km: number, maxKm: number): number => {
  const step = km < 100 ? 5 : km < 1000 ? 10 : km < 10000 ? 50 : 100;
  return Math.min(maxKm, Math.max(MIN_DISTANCE_KM, Math.round(km / step) * step));
};

/** Position [0, 1] sur un curseur a echelle logarithmique -> distance en km. */
export const ratioToKm = (ratio: number, maxKm: number): number =>
  roundDistance(MIN_DISTANCE_KM * Math.exp(Math.log(maxKm / MIN_DISTANCE_KM) * clamp01(ratio)), maxKm);

/** Distance en km -> position [0, 1] sur un curseur a echelle logarithmique. */
export const kmToRatio = (km: number, maxKm: number): number =>
  clamp01(Math.log(km / MIN_DISTANCE_KM) / Math.log(maxKm / MIN_DISTANCE_KM));
