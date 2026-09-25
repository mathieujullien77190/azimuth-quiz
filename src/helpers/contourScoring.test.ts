import { CONTOUR_GUESS_POINTS_BY_HINTS, MAX_CONTOUR_POINTS } from '@/constants';
import type { Point2D } from '@/types';

import { scoreCityGuess, scoreCountryGuess } from './contourScoring';

describe('scoreCityGuess', () => {
  const truth: Point2D = { x: 150, y: 150 };

  it('awards the max score for a guess exactly on the true position', () => {
    expect(scoreCityGuess(truth, truth, 300).cityPoints).toBe(MAX_CONTOUR_POINTS);
  });

  it('awards fewer points the farther the guess is', () => {
    const close = scoreCityGuess({ x: 155, y: 150 }, truth, 300);
    const far = scoreCityGuess({ x: 220, y: 150 }, truth, 300);
    expect(close.cityPoints).toBeGreaterThan(far.cityPoints);
  });

  it('awards 0 points once the error passes the tolerance', () => {
    expect(scoreCityGuess({ x: 150, y: 150 + 300 }, truth, 300).cityPoints).toBe(0);
  });

  it('awards 0 points (and an infinite error) when no marker was placed', () => {
    const score = scoreCityGuess(undefined, truth, 300);
    expect(score.cityPoints).toBe(0);
    expect(score.cityErrorPx).toBe(Infinity);
  });
});

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
