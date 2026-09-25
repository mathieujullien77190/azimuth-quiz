import { CONTOUR_ERROR_TOLERANCE_RATIO, CONTOUR_GUESS_POINTS_BY_HINTS, CONTOUR_SCORE_CURVE_EXPONENT, MAX_CONTOUR_POINTS } from '@/constants';
import type { ContourCityScore, Point2D } from '@/types';

const distance = (a: Point2D, b: Point2D): number => Math.hypot(a.x - b.x, a.y - b.y);

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** CONTOUR_SCORE_CURVE_EXPONENT;

/**
 * Scores a player's city-marker placement: straight pixel distance between the guess and the
 * true city position, run through a falloff curve (perfect placement scores MAX_CONTOUR_POINTS,
 * degrading to 0 past `boardSize * CONTOUR_ERROR_TOLERANCE_RATIO`).
 */
export const scoreCityGuess = (guess: Point2D | undefined, truth: Point2D, boardSize: number): ContourCityScore => {
  if (guess === undefined) return { cityErrorPx: Infinity, cityPoints: 0 };

  const cityErrorPx = distance(guess, truth);
  const tolerancePx = boardSize * CONTOUR_ERROR_TOLERANCE_RATIO;
  const cityPoints = Math.round(MAX_CONTOUR_POINTS * curve(1 - cityErrorPx / tolerancePx));

  return { cityErrorPx, cityPoints };
};

/**
 * Points for correctly guessing the country, tiered by how many hints were already revealed
 * (0-3) when the guess landed — see `CONTOUR_GUESS_POINTS_BY_HINTS`. Flat tiers rather than a
 * falloff curve: there's no distance to measure for a country-name guess.
 */
export const scoreCountryGuess = (hintsRevealed: number): number =>
  CONTOUR_GUESS_POINTS_BY_HINTS[Math.min(hintsRevealed, CONTOUR_GUESS_POINTS_BY_HINTS.length - 1)];
