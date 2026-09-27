import { BLINK_PERIOD_MS, BOB_AMPLITUDE, BOB_PERIOD_MS } from './constants';
import type { UfoIdleFrame } from './types';

const blink = (elapsedMs: number, phaseOffsetMs: number): number =>
  0.4 + 0.6 * ((Math.sin(((elapsedMs + phaseOffsetMs) / BLINK_PERIOD_MS) * 2 * Math.PI) + 1) / 2);

/** Vertical bobbing + light blinking (2 alternating phases), at instant `elapsedMs`
 * since mount. */
export const ufoIdleFrame = (elapsedMs: number): UfoIdleFrame => ({
  bobY: Math.sin((elapsedMs / BOB_PERIOD_MS) * 2 * Math.PI) * BOB_AMPLITUDE,
  blinkOpacityA: blink(elapsedMs, 0),
  blinkOpacityB: blink(elapsedMs, BLINK_PERIOD_MS / 2),
});
