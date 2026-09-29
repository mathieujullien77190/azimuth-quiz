import { BLINK_PERIOD_MS, BOB_AMPLITUDE, BOB_PERIOD_MS, SPIN_DURATION_MS, SPIN_PERIOD_MS } from './constants';
import type { UfoIdleFrame } from './types';

const blink = (elapsedMs: number, phaseOffsetMs: number): number =>
  0.4 + 0.6 * ((Math.sin(((elapsedMs + phaseOffsetMs) / BLINK_PERIOD_MS) * 2 * Math.PI) + 1) / 2);

/** A full turn (0 to 360) over the first `SPIN_DURATION_MS` of every `SPIN_PERIOD_MS`, then back
 * to 0 (no rotation) for the rest of the period. */
const spin = (elapsedMs: number): number => {
  const phase = elapsedMs % SPIN_PERIOD_MS;
  return phase < SPIN_DURATION_MS ? (phase / SPIN_DURATION_MS) * 360 : 0;
};

/** Vertical bobbing + light blinking (2 alternating phases) + a periodic full turn on itself, at
 * instant `elapsedMs` since mount. */
export const ufoIdleFrame = (elapsedMs: number): UfoIdleFrame => ({
  bobY: Math.sin((elapsedMs / BOB_PERIOD_MS) * 2 * Math.PI) * BOB_AMPLITUDE,
  blinkOpacityA: blink(elapsedMs, 0),
  blinkOpacityB: blink(elapsedMs, BLINK_PERIOD_MS / 2),
  spinDeg: spin(elapsedMs),
});
