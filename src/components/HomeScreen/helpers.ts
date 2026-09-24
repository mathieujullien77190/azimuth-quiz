import { MASCOT_FOOTPRINT, MASCOT_PAUSE_OPTIONS_S } from './constants';

export type MascotPosition = { top: number; left: number };

/** Random position for the mascot, fully contained within a zoneWidth x zoneHeight zone. */
export const randomMascotPosition = (zoneWidth: number, zoneHeight: number): MascotPosition => {
  const maxLeft = Math.max(0, zoneWidth - MASCOT_FOOTPRINT.width);
  const maxTop = Math.max(0, zoneHeight - MASCOT_FOOTPRINT.height);
  return {
    top: Math.round(Math.random() * maxTop),
    left: Math.round(Math.random() * maxLeft),
  };
};

/** Pause duration (in seconds) at rest between two moves: 3, 4, 5 or 6 at random. */
export const randomMascotPauseSeconds = (): (typeof MASCOT_PAUSE_OPTIONS_S)[number] =>
  MASCOT_PAUSE_OPTIONS_S[Math.floor(Math.random() * MASCOT_PAUSE_OPTIONS_S.length)];
