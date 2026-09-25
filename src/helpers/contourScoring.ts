import { CONTOUR_ERROR_TOLERANCE_RATIO, CONTOUR_RESAMPLE_POINTS, CONTOUR_SCORE_CURVE_EXPONENT, MAX_CONTOUR_POINTS } from '@/constants';
import type { ContourCityScore, ContourTraceScore, Point2D } from '@/types';

const distance = (a: Point2D, b: Point2D): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Resamples a polyline to `count` points evenly spaced by arc length (not by index): a fast
 * stroke with few captured points and a slow one with many end up directly comparable.
 * Degenerate input (a single point, or every point identical) returns `count` copies of it.
 */
export const resamplePolyline = (points: readonly Point2D[], count: number): Point2D[] => {
  if (points.length === 0) return [];
  if (points.length === 1 || count === 1) return Array.from({ length: count }, () => points[0]);

  const segmentLengths = points.slice(1).map((point, index) => distance(points[index], point));
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  if (totalLength === 0) return Array.from({ length: count }, () => points[0]);

  const cumulative = segmentLengths.reduce<number[]>((acc, length) => [...acc, (acc[acc.length - 1] ?? 0) + length], []);

  return Array.from({ length: count }, (_, index) => {
    const target = (totalLength * index) / (count - 1);
    const segmentIndex = cumulative.findIndex((length) => length >= target);
    if (segmentIndex === -1) return points[points.length - 1];
    const segmentStart = cumulative[segmentIndex - 1] ?? 0;
    const segmentLength = segmentLengths[segmentIndex];
    const ratio = segmentLength === 0 ? 0 : (target - segmentStart) / segmentLength;
    const from = points[segmentIndex];
    const to = points[segmentIndex + 1];
    return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
  });
};

/** Mean point-to-point distance between two same-length polylines (already resampled to the
 * same point count): a cheap proxy for "how similar are these two shapes", good enough given
 * both curves share the same two anchor endpoints. */
export const averagePointDistance = (a: readonly Point2D[], b: readonly Point2D[]): number => {
  const count = Math.min(a.length, b.length);
  if (count === 0) return 0;
  let sum = 0;
  for (let index = 0; index < count; index += 1) sum += distance(a[index], b[index]);
  return sum / count;
};

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** CONTOUR_SCORE_CURVE_EXPONENT;

/**
 * Scores one player's trace against the true hidden arc. Both are resampled to the same point
 * count then compared by mean distance, tried in both directions (the board doesn't force which
 * anchor the player starts from) and the smaller error kept, converted to points via a falloff
 * curve (same spirit as `helpers/scoring.ts`'s `curve`): a perfect trace scores
 * MAX_CONTOUR_POINTS, degrading to 0 once the error reaches `boardSize * CONTOUR_ERROR_TOLERANCE_RATIO`.
 */
export const scoreContourRound = (
  trace: readonly Point2D[],
  hiddenArc: readonly Point2D[],
  boardSize: number,
): ContourTraceScore => {
  if (trace.length < 2) return { traceErrorPx: Infinity, tracePoints: 0 };

  const resampledTruth = resamplePolyline(hiddenArc, CONTOUR_RESAMPLE_POINTS);
  const resampledForward = resamplePolyline(trace, CONTOUR_RESAMPLE_POINTS);
  const resampledReversed = resamplePolyline([...trace].reverse(), CONTOUR_RESAMPLE_POINTS);
  const traceErrorPx = Math.min(
    averagePointDistance(resampledForward, resampledTruth),
    averagePointDistance(resampledReversed, resampledTruth),
  );

  const tolerancePx = boardSize * CONTOUR_ERROR_TOLERANCE_RATIO;
  const tracePoints = Math.round(MAX_CONTOUR_POINTS * curve(1 - traceErrorPx / tolerancePx));

  return { traceErrorPx, tracePoints };
};

/**
 * Scores a player's city-marker placement: straight pixel distance between the guess and the
 * true city position, run through the same falloff curve/tolerance as `scoreContourRound` so
 * both halves of the round feel the same (perfect placement scores MAX_CONTOUR_POINTS, degrading
 * to 0 past `boardSize * CONTOUR_ERROR_TOLERANCE_RATIO`).
 */
export const scoreCityGuess = (guess: Point2D | undefined, truth: Point2D, boardSize: number): ContourCityScore => {
  if (guess === undefined) return { cityErrorPx: Infinity, cityPoints: 0 };

  const cityErrorPx = distance(guess, truth);
  const tolerancePx = boardSize * CONTOUR_ERROR_TOLERANCE_RATIO;
  const cityPoints = Math.round(MAX_CONTOUR_POINTS * curve(1 - cityErrorPx / tolerancePx));

  return { cityErrorPx, cityPoints };
};
