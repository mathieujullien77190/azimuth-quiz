import { MIN_DISTANCE_KM } from '@/games/compass/constants';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Rounds to a readable step: the bigger the distance, the bigger the step. Also the finest
 * precision the distance slider can actually reach at that magnitude (see `ratioToKm`) — reused
 * by `scoreRound` to know what counts as an exact guess. */
export const roundDistance = (km: number, maxKm: number): number => {
  const step = km < 100 ? 5 : km < 1000 ? 10 : km < 10000 ? 50 : 100;
  return Math.min(maxKm, Math.max(MIN_DISTANCE_KM, Math.round(km / step) * step));
};

/**
 * Position [0, 1] on a logarithmic-scale slider -> distance in km.
 * No rounding at either extreme: otherwise the 100 km step would round, say,
 * 20,000 km down to 19,900 km — the maximum must stay reachable exactly.
 */
export const ratioToKm = (ratio: number, maxKm: number): number => {
  const clamped = clamp01(ratio);
  if (clamped >= 1) return maxKm;
  if (clamped <= 0) return MIN_DISTANCE_KM;
  return roundDistance(MIN_DISTANCE_KM * Math.exp(Math.log(maxKm / MIN_DISTANCE_KM) * clamped), maxKm);
};

/** Distance in km -> position [0, 1] on a logarithmic-scale slider. */
export const kmToRatio = (km: number, maxKm: number): number =>
  clamp01(Math.log(km / MIN_DISTANCE_KM) / Math.log(maxKm / MIN_DISTANCE_KM));
