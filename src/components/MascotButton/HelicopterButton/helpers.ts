import { BLINK_PERIOD_MS, BOB_AMPLITUDE, BOB_PERIOD_MS, ROTOR_PERIOD_MS } from './constants';
import type { HelicopterIdleFrame } from './types';

const blink = (elapsedMs: number, phaseOffsetMs: number): number =>
  0.4 + 0.6 * ((Math.sin(((elapsedMs + phaseOffsetMs) / BLINK_PERIOD_MS) * 2 * Math.PI) + 1) / 2);

/** Vertical bobbing + main rotor spin + anti-collision light blinking, at instant `elapsedMs`
 * since mount. */
export const helicopterIdleFrame = (elapsedMs: number): HelicopterIdleFrame => ({
  bobY: Math.sin((elapsedMs / BOB_PERIOD_MS) * 2 * Math.PI) * BOB_AMPLITUDE,
  rotorAngleDeg: ((elapsedMs / ROTOR_PERIOD_MS) * 360) % 360,
  blinkOpacity: blink(elapsedMs, 0),
});
