import { SWAY_DECAY, SWAY_LEGS, SWAY_SAMPLES_PER_LEG, SWAY_START_DEG } from './constants';
import type { SwayCurve } from './types';

const SAMPLES = SWAY_LEGS * SWAY_SAMPLES_PER_LEG;

/**
 * Courbe de l'aiguille : un balancier amorti, `angle(x) = A * DECAY^x * sin(pi * x + phase)` avec x en sens ecoules.
 * L'avancement 0..1 (`inputRange`) donne l'angle en degres (`outputRange`, 0 = nord) ; la derniere valeur est le
 * nord exactement. `phase` 0 part du nord vers le haut ; une autre phase reprend le balancier en cours (voir `kickPhase`).
 */
export const buildCurve = (phase: number): SwayCurve => ({
  inputRange: Array.from({ length: SAMPLES + 1 }, (_, index) => index / SAMPLES),
  outputRange: Array.from({ length: SAMPLES + 1 }, (_, index) => {
    if (index === SAMPLES) return 0;
    const legs = index / SWAY_SAMPLES_PER_LEG;
    return SWAY_START_DEG * SWAY_DECAY ** legs * Math.sin(Math.PI * legs + phase);
  }),
});

/** Courbe de depart: l'aiguille part du nord. */
export const REST_CURVE = buildCurve(0);

/** Angle de `curve` a l'avancement `progress` (0..1), interpole comme le fait l'animation. */
export const angleAt = (curve: SwayCurve, progress: number): number => {
  const position = Math.min(Math.max(progress, 0), 1) * SAMPLES;
  const index = Math.min(Math.floor(position), SAMPLES - 1);
  const from = curve.outputRange[index];
  const to = curve.outputRange[index + 1];
  return from + (to - from) * (position - index);
};

/** L'aiguille va-t-elle vers les angles croissants a l'avancement `progress` ? (A l'arret: oui.) */
export const isRising = (curve: SwayCurve, progress: number): boolean =>
  angleAt(curve, progress + 1 / SAMPLES) >= angleAt(curve, progress - 1 / SAMPLES);

/**
 * Phase d'une nouvelle courbe qui commence a `angle` en allant dans le meme sens (`rising`) mais avec tout l'ecart
 * de depart: l'aiguille va plus loin dans son sens, puis se calme sur une minute entiere.
 */
export const kickPhase = (angle: number, rising: boolean): number => {
  const base = Math.asin(Math.min(Math.max(angle / SWAY_START_DEG, -1), 1));
  return rising ? base : Math.PI - base;
};
