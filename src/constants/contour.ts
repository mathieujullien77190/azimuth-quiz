import type { ContourSettings } from '@/types';

// Mean error (as a share of the board's pixel size) beyond which a city guess scores 0.
export const CONTOUR_ERROR_TOLERANCE_RATIO = 0.22;
// Points decay curve (>1 = steeper near the right answer), same shape as Boussole's own
// SCORE_CURVE_EXPONENT.
export const CONTOUR_SCORE_CURVE_EXPONENT = 1.5;
export const MAX_CONTOUR_POINTS = 500;

// guessPoints by how many hints were already revealed (0-3) when the correct guess landed: a
// flat 25%-per-hint taper of MAX_CONTOUR_POINTS rather than a continuous curve — there's no
// distance to measure for a country-name guess, unlike the city/scoreCityGuess falloff above.
export const CONTOUR_GUESS_POINTS_BY_HINTS = [1, 0.75, 0.5, 0.25].map((ratio) => Math.round(MAX_CONTOUR_POINTS * ratio));

// Flat penalty deducted from whichever player is attributed a wrong country guess (see
// ContourGameScreen's post-"Valider" attribution step) — same amount regardless of hint tier.
export const CONTOUR_WRONG_GUESS_PENALTY = 50;

export const CONTOUR_PLACES_COUNT_OPTIONS = [1, 3, 5] as const;

// One per place drawn this round (up to CONTOUR_PLACES_COUNT_OPTIONS' max of 5), cycled by place
// index — colors the guess-to-solution dashed connector line (ContourBoardConnector.color), kept
// distinct from PLAYER_COLORS since that palette already means "which player" on the same board:
// this one means "which place" instead, so overlapping lines from several places stay tellable
// apart at a glance.
export const CONTOUR_PLACE_LINE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'] as const;

export const DEFAULT_CONTOUR_SETTINGS: ContourSettings = {
  playerNames: [''],
  rounds: 5,
  placesCount: 3,
  difficulty: 'easy',
};
