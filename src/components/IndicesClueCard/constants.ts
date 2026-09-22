import type { IndicesPositionInCountry } from '@/types';

/** Centre du petit carre "ville" dans le grand carre "pays", en % (grille 3x3). */
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

// Indices 'bearing'/'distance' : passent en carte pleine largeur une fois reveles, pour laisser
// respirer la boussole / la Terre (composants repris tels quels de Full Azimut).
export const COMPASS_CLUE_SIZE = 140;
export const EARTH_CLUE_SIZE = 170;
