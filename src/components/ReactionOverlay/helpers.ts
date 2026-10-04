import { LANES, LANE_PX, WOBBLE_CYCLES, WOBBLE_PX, WOBBLE_STEPS } from './constants';

/** The sideways drift of a rising bubble: a sine sampled as the `inputRange`/`outputRange` of an `interpolate`. */
export const wobbleCurve = (): { inputRange: number[]; outputRange: number[] } => {
  const inputRange = Array.from({ length: WOBBLE_STEPS + 1 }, (_, step) => step / WOBBLE_STEPS);
  return { inputRange, outputRange: inputRange.map((at) => Math.sin(at * WOBBLE_CYCLES * 2 * Math.PI) * WOBBLE_PX) };
};

/** Which lane a bubble rises along, as a sideways offset from the middle (px), from its `seq`. */
export const laneOffset = (seq: number): number => ((seq % LANES) - (LANES - 1) / 2) * LANE_PX;
