import { MAX_CONTOUR_POINTS } from '@/constants';
import type { Point2D } from '@/types';

import { averagePointDistance, resamplePolyline, scoreCityGuess, scoreContourRound } from './contourScoring';

const line = (from: Point2D, to: Point2D, count: number): Point2D[] =>
  Array.from({ length: count }, (_, index) => ({
    x: from.x + (to.x - from.x) * (index / (count - 1)),
    y: from.y + (to.y - from.y) * (index / (count - 1)),
  }));

describe('resamplePolyline', () => {
  it('keeps both endpoints fixed', () => {
    const points = line({ x: 0, y: 0 }, { x: 100, y: 0 }, 5);
    const resampled = resamplePolyline(points, 10);
    expect(resampled[0]).toEqual({ x: 0, y: 0 });
    expect(resampled[resampled.length - 1].x).toBeCloseTo(100);
  });

  it('produces evenly spaced points regardless of the input\'s own point density', () => {
    // A single long segment vs. the same segment cut into many tiny ones: same shape.
    const sparse = resamplePolyline(line({ x: 0, y: 0 }, { x: 100, y: 0 }, 2), 5);
    const dense = resamplePolyline(line({ x: 0, y: 0 }, { x: 100, y: 0 }, 50), 5);
    sparse.forEach((point, index) => {
      expect(point.x).toBeCloseTo(dense[index].x);
    });
  });

  it('handles a single-point input without dividing by zero', () => {
    const resampled = resamplePolyline([{ x: 5, y: 5 }], 4);
    expect(resampled).toEqual([
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ]);
  });

  it('returns an empty array for an empty input', () => {
    expect(resamplePolyline([], 5)).toEqual([]);
  });
});

describe('averagePointDistance', () => {
  it('is 0 for identical polylines', () => {
    const points = line({ x: 0, y: 0 }, { x: 10, y: 10 }, 5);
    expect(averagePointDistance(points, points)).toBe(0);
  });

  it('is the mean of the per-point distances', () => {
    const a = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    const b = [{ x: 3, y: 4 }, { x: 0, y: 0 }];
    expect(averagePointDistance(a, b)).toBe(2.5);
  });
});

describe('scoreContourRound', () => {
  const truth = line({ x: 0, y: 0 }, { x: 100, y: 0 }, 20);

  it('awards the max score for a trace identical to the true arc', () => {
    expect(scoreContourRound(truth, truth, 300).tracePoints).toBe(MAX_CONTOUR_POINTS);
  });

  it('scores a reversed trace the same as the forward one (either anchor is a valid start)', () => {
    const forward = scoreContourRound(truth, truth, 300);
    const reversed = scoreContourRound([...truth].reverse(), truth, 300);
    expect(reversed.tracePoints).toBe(forward.tracePoints);
  });

  it('awards 0 points for a trace far from the true arc', () => {
    const farTrace = line({ x: 0, y: 1000 }, { x: 100, y: 1000 }, 20);
    expect(scoreContourRound(farTrace, truth, 300).tracePoints).toBe(0);
  });

  it('awards fewer points for a rougher approximation than a close one', () => {
    const close = line({ x: 0, y: 5 }, { x: 100, y: 5 }, 20);
    const rough = line({ x: 0, y: 40 }, { x: 100, y: 40 }, 20);
    const closeScore = scoreContourRound(close, truth, 300);
    const roughScore = scoreContourRound(rough, truth, 300);
    expect(closeScore.tracePoints).toBeGreaterThan(roughScore.tracePoints);
  });

  it('awards 0 points when the player never drew anything (fewer than 2 points)', () => {
    expect(scoreContourRound([], truth, 300).tracePoints).toBe(0);
    expect(scoreContourRound([{ x: 0, y: 0 }], truth, 300).tracePoints).toBe(0);
  });
});

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
