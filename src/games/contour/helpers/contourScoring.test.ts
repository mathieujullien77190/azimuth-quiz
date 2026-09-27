import { CONTOUR_GUESS_POINTS_BY_HINTS, MAX_CONTOUR_POINTS } from '@/games/contour/constants';

import { scoreCountryGuess } from './contourScoring';

describe('scoreCountryGuess', () => {
  it('awards the max score for a guess with no hints revealed', () => {
    expect(scoreCountryGuess(0)).toBe(MAX_CONTOUR_POINTS);
  });

  it('matches CONTOUR_GUESS_POINTS_BY_HINTS for each tier', () => {
    CONTOUR_GUESS_POINTS_BY_HINTS.forEach((points, hintsRevealed) => {
      expect(scoreCountryGuess(hintsRevealed)).toBe(points);
    });
  });

  it('awards strictly fewer points for each extra hint already revealed', () => {
    expect(scoreCountryGuess(1)).toBeLessThan(scoreCountryGuess(0));
    expect(scoreCountryGuess(2)).toBeLessThan(scoreCountryGuess(1));
    expect(scoreCountryGuess(3)).toBeLessThan(scoreCountryGuess(2));
  });

  it('clamps at the lowest tier instead of going out of bounds past 3 hints', () => {
    expect(scoreCountryGuess(4)).toBe(scoreCountryGuess(3));
  });
});
