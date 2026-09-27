import type { ContourSettings } from '@/types';

export const MAX_CONTOUR_POINTS = 500;

// guessPoints by how many hints were already revealed (0-3) when the correct guess landed: a
// flat 25%-per-hint taper of MAX_CONTOUR_POINTS — there's no distance to measure for a
// country-name guess, unlike a falloff curve on a position error.
export const CONTOUR_GUESS_POINTS_BY_HINTS = [1, 0.75, 0.5, 0.25].map((ratio) => Math.round(MAX_CONTOUR_POINTS * ratio));

// Flat penalty deducted from whichever player is attributed a wrong country guess (see
// ContourGameScreen's post-"Valider" attribution step) — same amount regardless of hint tier.
export const CONTOUR_WRONG_GUESS_PENALTY = 50;

export const DEFAULT_CONTOUR_SETTINGS: ContourSettings = {
  playerNames: [''],
  rounds: 5,
  difficulty: 'easy',
};
