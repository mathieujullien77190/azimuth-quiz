import { PLACES, spacing } from '@/constants';
import { shuffle } from '@/helpers';
import type { ContourCountry, ContourRoundRecord, Place, Point2D } from '@/types';

import { MAX_BOARD_HEIGHT_RATIO, MAX_BOARD_HEIGHT_VIEWPORT_RATIO, MAX_BOARD_WIDTH } from './constants';

/** Board's max width/height, responsive to the window (same idea as compassSizeFor/earthSizeFor
 * in GameScreen/helpers.ts) — the actual canvas is then fit to the country's own aspect ratio
 * within these caps (see ContourBoard's `boardDimensionsFor`). Computed once per round (see
 * ContourGameScreen's startRound) and kept fixed through it: the player's captured trace and the
 * true arc must stay in the same frame for the whole round, even if the window resizes mid-round. */
export const boardMaxSizeFor = (windowWidth: number, windowHeight: number): { maxWidth: number; maxHeight: number } => {
  const rawWidth = Math.min(MAX_BOARD_WIDTH, windowWidth - spacing.lg * 2);
  const maxWidth = rawWidth > 0 ? rawWidth : MAX_BOARD_WIDTH;
  const rawHeight = Math.min(maxWidth * MAX_BOARD_HEIGHT_RATIO, windowHeight * MAX_BOARD_HEIGHT_VIEWPORT_RATIO);
  const maxHeight = rawHeight > 0 ? rawHeight : maxWidth * MAX_BOARD_HEIGHT_RATIO;
  return { maxWidth, maxHeight };
};

/** Tab order (and who plays first) for a round: pure rotation starting from player
 * `roundIndex % playerCount`, same idea as Boussole's `rotatedOrder` (GameScreen/helpers.ts). */
export const rotatedOrder = (roundIndex: number, playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, i) => (roundIndex + i) % playerCount);

/** Each player's point total (trace + every place's city score), in player order. */
export const contourPlayerTotals = (records: ContourRoundRecord[], playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, playerIndex) =>
    records.reduce((total, record) => total + (record.results[playerIndex]?.score.total ?? 0), 0),
  );

/** Random country for a new round, avoiding an immediate repeat of `excludeCode` whenever
 * there's more than one to choose from. */
export const randomCountry = (countries: ContourCountry[], excludeCode?: string): ContourCountry => {
  const candidates = countries.length > 1 ? countries.filter((country) => country.code !== excludeCode) : countries;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/** Up to `count` distinct random Boussole places (see PLACES in constants/places, any category)
 * matching the country, for the round's city phase — fewer (down to none) if the country doesn't
 * have that many; the caller must handle a short (or empty) result. */
export const randomPlacesFor = (countryCode: string, count: number): Place[] => {
  const candidates = PLACES.filter((place) => place.code === countryCode);
  return shuffle(candidates).slice(0, count);
};

const pointDistance = (a: Point2D, b: Point2D): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Which still-unclaimed hole a freshly drawn trace was most likely aimed at: there's no explicit
 * pick step any more, so the target is inferred from the trace itself. Compares the trace's own
 * two endpoints to each candidate hole's two shared anchors (both pairings, since the player can
 * start drawing from either end), picks the hole with the smallest combined distance. Returns -1
 * if every hole is already claimed or the trace is degenerate (fewer than 2 points) — shouldn't
 * happen in practice (exactly one hole per player, and the "Valider" button stays disabled until
 * the trace has at least 2 points), but the caller must still handle it (score 0 for that turn).
 */
export const nearestUnclaimedHole = (
  trace: readonly Point2D[],
  holes: readonly Point2D[][],
  claimedIndexes: ReadonlySet<number>,
): number => {
  if (trace.length < 2) return -1;
  const traceStart = trace[0];
  const traceEnd = trace[trace.length - 1];

  let bestIndex = -1;
  let bestDistance = Infinity;
  holes.forEach((hole, index) => {
    if (claimedIndexes.has(index) || hole.length < 2) return;
    const holeStart = hole[0];
    const holeEnd = hole[hole.length - 1];
    const forward = pointDistance(traceStart, holeStart) + pointDistance(traceEnd, holeEnd);
    const backward = pointDistance(traceStart, holeEnd) + pointDistance(traceEnd, holeStart);
    const candidateDistance = Math.min(forward, backward);
    if (candidateDistance < bestDistance) {
      bestDistance = candidateDistance;
      bestIndex = index;
    }
  });
  return bestIndex;
};
