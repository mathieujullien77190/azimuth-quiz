import { CONTOUR_GUESS_POINTS_BY_HINTS } from '@/games/contour/constants';

/**
 * Points for correctly guessing the country, tiered by how many hints were already revealed
 * (0-3) when the guess landed — see `CONTOUR_GUESS_POINTS_BY_HINTS`. Flat tiers rather than a
 * falloff curve: there's no distance to measure for a country-name guess.
 */
export const scoreCountryGuess = (hintsRevealed: number): number =>
  CONTOUR_GUESS_POINTS_BY_HINTS[Math.min(hintsRevealed, CONTOUR_GUESS_POINTS_BY_HINTS.length - 1)];
