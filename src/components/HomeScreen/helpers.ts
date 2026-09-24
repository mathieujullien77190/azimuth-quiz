import { UFO_FOOTPRINT, UFO_PAUSE_OPTIONS_S } from './constants';

export type UfoPosition = { top: number; left: number };

/** Random position for the UFO, fully contained within a zoneWidth x zoneHeight zone. */
export const randomUfoPosition = (zoneWidth: number, zoneHeight: number): UfoPosition => {
  const maxLeft = Math.max(0, zoneWidth - UFO_FOOTPRINT.width);
  const maxTop = Math.max(0, zoneHeight - UFO_FOOTPRINT.height);
  return {
    top: Math.round(Math.random() * maxTop),
    left: Math.round(Math.random() * maxLeft),
  };
};

/** Pause duration (in seconds) at rest between two moves: 3, 4, 5 or 6 at random. */
export const randomUfoPauseSeconds = (): (typeof UFO_PAUSE_OPTIONS_S)[number] =>
  UFO_PAUSE_OPTIONS_S[Math.floor(Math.random() * UFO_PAUSE_OPTIONS_S.length)];
