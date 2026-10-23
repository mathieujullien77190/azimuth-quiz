import {
  SPIN_AFTER_LEGS_MAX,
  SPIN_AFTER_LEGS_MIN,
  SPIN_EASE_MS,
  SPIN_TURN_MS,
  SPIN_TURNS_MAX,
  SPIN_TURNS_MIN,
  SWAY_DECAY,
  SWAY_LEGS,
  SWAY_SAMPLES_PER_LEG,
  SWAY_START_DEG,
  SWAY_TOTAL_MS,
} from './constants';
import type { SwayCurve, SwayCycle } from './types';

const SAMPLES = SWAY_LEGS * SWAY_SAMPLES_PER_LEG;

/**
 * Courbe de l'aiguille : un balancier amorti, `angle(x) = A * DECAY^x * sin(pi * x + phase)` avec x en sens ecoules.
 * L'avancement 0..1 (`inputRange`) donne l'angle en degres (`outputRange`, 0 = nord). `phase` 0 part du nord vers le
 * haut ; `PI / 2` part du sommet haut, a l'arret.
 */
export const buildCurve = (phase: number): SwayCurve => ({
  inputRange: Array.from({ length: SAMPLES + 1 }, (_, index) => index / SAMPLES),
  outputRange: Array.from({ length: SAMPLES + 1 }, (_, index) => {
    const legs = index / SWAY_SAMPLES_PER_LEG;
    return SWAY_START_DEG * SWAY_DECAY ** legs * Math.sin(Math.PI * legs + phase);
  }),
});

/** Premiere courbe: l'aiguille part du nord. Les suivantes (apres des tours) partent du sommet haut, a l'arret. */
export const REST_CURVE = buildCurve(0);
export const PEAK_CURVE = buildCurve(Math.PI / 2);

/** Angle de `curve` a l'avancement `progress` (0..1), interpole comme le fait l'animation. */
export const angleAt = (curve: SwayCurve, progress: number): number => {
  const position = Math.min(Math.max(progress, 0), 1) * SAMPLES;
  const index = Math.min(Math.floor(position), SAMPLES - 1);
  const from = curve.outputRange[index];
  const to = curve.outputRange[index + 1];
  return from + (to - from) * (position - index);
};

/**
 * Prochain cycle: le balancier tourne un nombre aleatoire de sens, s'arrete sur un sommet (vitesse nulle, ecart
 * deja reduit), fait plusieurs tours rapides dans un sens aleatoire et s'arrete sur le sommet haut de la courbe
 * suivante (`PEAK_CURVE`) : aucun saut. `first` = la courbe en cours est `REST_CURVE` (ses sommets sont a mi-sens).
 */
export const planCycle = (first: boolean, random: () => number): SwayCycle => {
  const legs = SPIN_AFTER_LEGS_MIN + Math.floor(random() * (SPIN_AFTER_LEGS_MAX - SPIN_AFTER_LEGS_MIN + 1));
  const swayTo = (legs + (first ? 0.5 : 0)) / SWAY_LEGS;
  const turns = SPIN_TURNS_MIN + Math.floor(random() * (SPIN_TURNS_MAX - SPIN_TURNS_MIN + 1));
  const direction = random() < 0.5 ? 1 : -1;
  const peak = angleAt(first ? REST_CURVE : PEAK_CURVE, swayTo);
  return {
    swayTo,
    swayMs: swayTo * SWAY_TOTAL_MS,
    turnDeg: direction * turns * 360 + (SWAY_START_DEG - peak),
    spinMs: turns * SPIN_TURN_MS + SPIN_EASE_MS,
  };
};
