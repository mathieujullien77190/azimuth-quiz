import type { IndicesPositionInCountry } from '@/types';

/** Center of the small "city" square inside the big "country" square, in % (3x3 grid). */
export const POSITION_COORDS: Record<IndicesPositionInCountry, { left: number; top: number }> = {
  center: { left: 50, top: 50 },
  n: { left: 50, top: 18 },
  s: { left: 50, top: 82 },
  e: { left: 82, top: 50 },
  w: { left: 18, top: 50 },
  ne: { left: 82, top: 18 },
  nw: { left: 18, top: 18 },
  se: { left: 82, top: 82 },
  sw: { left: 18, top: 82 },
};

// 'bearing'/'distance' clues: switch to a full-width card once revealed, to give the
// compass / Earth (components reused as-is from Full Azimut) room to breathe.
export const COMPASS_CLUE_SIZE = 140;
export const EARTH_CLUE_SIZE = 170;
