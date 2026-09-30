import { GEAR_PERIOD_MS } from './constants';

/** The gear goes round continuously: 0 to 360 over every `GEAR_PERIOD_MS`, at `elapsedMs` since mount. */
export const gearAngleDeg = (elapsedMs: number): number => ((elapsedMs % GEAR_PERIOD_MS) / GEAR_PERIOD_MS) * 360;
