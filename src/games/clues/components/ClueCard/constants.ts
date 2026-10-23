import type { CluePositionInCountry } from '@/types';

/** Centre du petit carre "ville" dans le grand carre "pays", en % (grille 3x3). */
export const POSITION_COORDS: Record<CluePositionInCountry, { left: number; top: number }> = {
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

// Indices cap/distance : pleine largeur une fois devoiles, pour laisser respirer la boussole/Terre.
export const COMPASS_CLUE_SIZE = 140;
export const EARTH_CLUE_SIZE = 170;
// Indice globe : pleine largeur aussi (le globe est tourne au doigt).
export const GLOBE_CLUE_SIZE = 220;
