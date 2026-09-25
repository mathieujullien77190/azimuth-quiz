import type { ContourSettings } from '@/types';

// Share of the ring's points each hole hides, in multiplayer (one hole per player, holeCount
// >= 2) — at MAX_PLAYERS (6) holes that's 6 * 0.1 = 60% hidden at most. Tuning value, adjust to
// taste (was 0.08).
export const CONTOUR_HOLE_RATIO = 0.1;
// Share of the ring hidden by the single hole in solo (holeCount 1): a hole-picking step would be
// meaningless with only one player, so solo keeps the original, harder single-arc difficulty.
export const CONTOUR_SOLO_HOLE_RATIO = 0.4;
// Both the trace and the true hidden arc are resampled to this many points (evenly by arc
// length) before comparing them point-to-point — see helpers/contourScoring.ts.
export const CONTOUR_RESAMPLE_POINTS = 40;
// Mean error (as a share of the board's pixel size) beyond which a trace scores 0.
export const CONTOUR_ERROR_TOLERANCE_RATIO = 0.22;
// Points decay curve (>1 = steeper near a perfect trace), same shape as Boussole's own
// SCORE_CURVE_EXPONENT.
export const CONTOUR_SCORE_CURVE_EXPONENT = 1.5;
export const MAX_CONTOUR_POINTS = 500;

export const CONTOUR_PLACES_COUNT_OPTIONS = [1, 3, 5] as const;

export const DEFAULT_CONTOUR_SETTINGS: ContourSettings = {
  playerNames: [''],
  rounds: 5,
  placesCount: 3,
};
