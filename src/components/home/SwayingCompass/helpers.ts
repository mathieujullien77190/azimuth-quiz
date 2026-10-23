import { SWAY_DECAY, SWAY_LEGS, SWAY_START_DEG } from './constants';

/** Caps successifs de l'aiguille (degres, 0 = nord) : de part et d'autre du nord, de moins en moins loin, puis le nord. */
export const swayAngles = (): number[] => [
  ...Array.from({ length: SWAY_LEGS - 1 }, (_, leg) => (leg % 2 === 0 ? 1 : -1) * SWAY_START_DEG * SWAY_DECAY ** leg),
  0,
];
