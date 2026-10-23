import { GEAR_PERIOD_MS } from './constants';

/** Angle de l'engrenage (0 a 360 par `GEAR_PERIOD_MS`) a `elapsedMs` depuis le montage. */
export const gearAngleDeg = (elapsedMs: number): number => ((elapsedMs % GEAR_PERIOD_MS) / GEAR_PERIOD_MS) * 360;
