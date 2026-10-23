import { LANES, LANE_PX, WOBBLE_CYCLES, WOBBLE_PX, WOBBLE_STEPS } from './constants';

/** Oscillation laterale d'une bulle : un sinus echantillonne en `inputRange`/`outputRange` d'un `interpolate`. */
export const wobbleCurve = (): { inputRange: number[]; outputRange: number[] } => {
  const inputRange = Array.from({ length: WOBBLE_STEPS + 1 }, (_, step) => step / WOBBLE_STEPS);
  return { inputRange, outputRange: inputRange.map((at) => Math.sin(at * WOBBLE_CYCLES * 2 * Math.PI) * WOBBLE_PX) };
};

/** Voie d'une bulle, en decalage lateral depuis le milieu (px), deduite de son `seq`. */
export const laneOffset = (seq: number): number => ((seq % LANES) - (LANES - 1) / 2) * LANE_PX;
