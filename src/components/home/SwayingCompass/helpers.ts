import { SWAY_DECAY, SWAY_LEGS, SWAY_SAMPLES_PER_LEG, SWAY_START_DEG } from './constants';

const SAMPLES = SWAY_LEGS * SWAY_SAMPLES_PER_LEG;

/**
 * Courbe de l'aiguille : un balancier amorti, `angle(x) = A * DECAY^x * sin(pi * x)` avec x en sens ecoules. L'avancement
 * 0..1 (`inputRange`) donne l'angle en degres (`outputRange`, 0 = nord) ; la derniere valeur est le nord exactement.
 */
export const SWAY_CURVE = {
  inputRange: Array.from({ length: SAMPLES + 1 }, (_, index) => index / SAMPLES),
  outputRange: Array.from({ length: SAMPLES + 1 }, (_, index) => {
    if (index === SAMPLES) return 0;
    const legs = index / SWAY_SAMPLES_PER_LEG;
    return SWAY_START_DEG * SWAY_DECAY ** legs * Math.sin(Math.PI * legs);
  }),
};

/** Angle de la courbe a l'avancement `progress` (0..1), interpole comme le fait l'animation. */
export const angleAt = (progress: number): number => {
  const position = Math.min(Math.max(progress, 0), 1) * SAMPLES;
  const index = Math.min(Math.floor(position), SAMPLES - 1);
  const from = SWAY_CURVE.outputRange[index];
  const to = SWAY_CURVE.outputRange[index + 1];
  return from + (to - from) * (position - index);
};
