import type { ContourSettings } from '@/types';

const MAX_CONTOUR_POINTS = 500;

/** Number of hint tiers (`hintsRevealed` goes from 0 to this): 1-3 make the outline more precise
 * (see `simplificationLevels`), 4-7 are the neighbors' flags, the country's flag, the neighbors'
 * names and the country's name (the last one = giving up, see `buildHintLabels`). */
export const CONTOUR_MAX_HINTS = 7;

// guessPoints by how many hints were already revealed (0-6) when the correct guess landed: a
// hand-tuned taper of MAX_CONTOUR_POINTS — there's no distance to measure for a country-name
// guess, unlike a falloff curve on a position error. Nothing at the last tier (the name is out).
export const CONTOUR_GUESS_POINTS_BY_HINTS = [1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2].map((ratio) =>
  Math.round(MAX_CONTOUR_POINTS * ratio),
);

// Flat penalty deducted from whichever player is attributed a wrong country guess (see
// ContourGameScreen's post-"Valider" attribution step) — same amount regardless of hint tier.
export const CONTOUR_WRONG_GUESS_PENALTY = 50;

export const DEFAULT_CONTOUR_SETTINGS: ContourSettings = {
  playerName: '',
  rounds: 5,
  difficulty: 'easy',
};
