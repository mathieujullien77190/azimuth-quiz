import {
  BLINK_PERIOD_MS,
  BOB_AMPLITUDE,
  BOB_PERIOD_MS,
  ROTOR_PERIOD_MS,
  SPIN_DURATION_MS,
  SPIN_PERIOD_MS,
} from './constants';
import type { HelicopterIdleFrame } from './types';

const blink = (elapsedMs: number, phaseOffsetMs: number): number =>
  0.4 + 0.6 * ((Math.sin(((elapsedMs + phaseOffsetMs) / BLINK_PERIOD_MS) * 2 * Math.PI) + 1) / 2);

/** A full turn (0 to 360) over the first `SPIN_DURATION_MS` of every `SPIN_PERIOD_MS`, then back
 * to 0 (no rotation) for the rest of the period — the whole helicopter, not the main rotor. */
const spin = (elapsedMs: number): number => {
  const phase = elapsedMs % SPIN_PERIOD_MS;
  return phase < SPIN_DURATION_MS ? (phase / SPIN_DURATION_MS) * 360 : 0;
};

/** Vertical bobbing + main rotor spin + anti-collision light blinking + a periodic full turn on
 * itself, at instant `elapsedMs` since mount. */
export const helicopterIdleFrame = (elapsedMs: number): HelicopterIdleFrame => ({
  bobY: Math.sin((elapsedMs / BOB_PERIOD_MS) * 2 * Math.PI) * BOB_AMPLITUDE,
  rotorAngleDeg: ((elapsedMs / ROTOR_PERIOD_MS) * 360) % 360,
  blinkOpacity: blink(elapsedMs, 0),
  spinDeg: spin(elapsedMs),
});
