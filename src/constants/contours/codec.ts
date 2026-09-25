import type { ContourCenterLabel, ContourCountry, Difficulty } from '@/types';

import { CONTOUR_CENTER_LABELS } from './centerLabels';
import contoursData from './contours.json';
import { CONTOUR_NEIGHBORS } from './neighbors';

// Fallback if a country is ever missing from CONTOUR_CENTER_LABELS (shouldn't happen for the 8
// curated Contour countries, but keeps decoding total rather than throwing): the board's own
// dead center.
const DEFAULT_CENTER_LABEL: ContourCenterLabel = { x: 0.5, y: 0.5 };

const CONTOURS_RAW = contoursData as unknown as Record<string, [number, number][]>;

// Curated, not derived (outline recognizability is a judgment call — kept out of contours.json,
// same reasoning as neighbors.ts living alongside it rather than inside it): France is widely
// recognizable, Norway's fjorded coast makes it the hardest of the 8 to place blind, everything
// else is the default middle tier.
const CONTOUR_DIFFICULTIES: Record<string, Difficulty> = {
  FR: 'easy',
  NO: 'hard',
};
const DEFAULT_CONTOUR_DIFFICULTY: Difficulty = 'intermediate';

export const decodeContours = (raw: Record<string, [number, number][]>): ContourCountry[] =>
  Object.entries(raw).map(([code, points]) => ({
    code,
    points,
    neighbors: CONTOUR_NEIGHBORS[code] ?? [],
    centerLabel: CONTOUR_CENTER_LABELS[code] ?? DEFAULT_CENTER_LABEL,
    difficulty: CONTOUR_DIFFICULTIES[code] ?? DEFAULT_CONTOUR_DIFFICULTY,
  }));

export const CONTOURS: ContourCountry[] = decodeContours(CONTOURS_RAW);
