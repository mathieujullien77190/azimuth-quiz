import { HELICOPTER_FOOTPRINT, HELICOPTER_PAUSE_OPTIONS_S } from './constants';

export type HelicopterPosition = { top: number; left: number };

/** Random position for the helicopter, fully contained within a zoneWidth x zoneHeight zone. */
export const randomHelicopterPosition = (zoneWidth: number, zoneHeight: number): HelicopterPosition => {
  const maxLeft = Math.max(0, zoneWidth - HELICOPTER_FOOTPRINT.width);
  const maxTop = Math.max(0, zoneHeight - HELICOPTER_FOOTPRINT.height);
  return {
    top: Math.round(Math.random() * maxTop),
    left: Math.round(Math.random() * maxLeft),
  };
};

/** Pause duration (in seconds) at rest between two moves: 3, 4, 5 or 6 at random. */
export const randomHelicopterPauseSeconds = (): (typeof HELICOPTER_PAUSE_OPTIONS_S)[number] =>
  HELICOPTER_PAUSE_OPTIONS_S[Math.floor(Math.random() * HELICOPTER_PAUSE_OPTIONS_S.length)];
