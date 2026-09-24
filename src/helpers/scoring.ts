import {
  BEST_BONUS_RATIO,
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_RATIO,
  EXACT_DIRECTION_BONUS,
  EXACT_DISTANCE_BONUS,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  MAX_STRAIGHT_DISTANCE_KM,
  MAX_SURFACE_DISTANCE_KM,
  RANKS,
  SCORE_CURVE_EXPONENT,
} from '@/constants';
import type { Coordinates, GameSettings, Guess, Place, PlayerResult, Rank, RoundScore } from '@/types';

import { angleDifference, bearingDeg, distanceKm, inclinationDeg, straightDistanceKm } from './geo';
import { roundDistance } from './distanceScale';

export type ScoringOptions = Pick<GameSettings, 'straightLine'>;

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** SCORE_CURVE_EXPONENT;

/**
 * Scores an answer. Direction (heading) and distance/inclination are two independent axes, each
 * capped at MAX_DIRECTION_POINTS / MAX_DISTANCE_POINTS: a perfect heading gives the full 500
 * direction points regardless of the chosen inclination, and vice versa. In "straightLine" mode,
 * the distance comparison is done on the chord (so on the inclination), never mixed with the heading.
 */
export const scoreRound = (origin: Coordinates, place: Place, guess: Guess, options: ScoringOptions): RoundScore => {
  const trueBearing = bearingDeg(origin, place.coordinates);
  const trueInclination = inclinationDeg(origin, place.coordinates);
  const trueSurfaceDistanceKm = distanceKm(origin, place.coordinates);
  const trueStraightDistanceKm = straightDistanceKm(origin, place.coordinates);
  const trueDistanceForGuess = options.straightLine ? trueStraightDistanceKm : trueSurfaceDistanceKm;
  const maxDistanceKm = options.straightLine ? MAX_STRAIGHT_DISTANCE_KM : MAX_SURFACE_DISTANCE_KM;

  const directionError = angleDifference(guess.bearing, trueBearing);
  const directionPoints = Math.round(MAX_DIRECTION_POINTS * curve(1 - directionError / DIRECTION_TOLERANCE_DEG));
  const directionExactBonus = Math.round(directionError) === 0 ? EXACT_DIRECTION_BONUS : 0;

  const distanceError = Math.abs(Math.log(guess.distanceKm / trueDistanceForGuess));
  const distancePoints = Math.round(
    MAX_DISTANCE_POINTS * curve(1 - distanceError / Math.log(DISTANCE_TOLERANCE_RATIO)),
  );
  // Exact bonus at the slider's own precision: the bigger the true distance, the coarser the
  // step it can actually be set to (see `roundDistance`), so "exact" means landing on the
  // closest reachable step, not matching the true value bit-for-bit.
  const distanceExactBonus = roundDistance(trueDistanceForGuess, maxDistanceKm) === guess.distanceKm ? EXACT_DISTANCE_BONUS : 0;

  return {
    trueBearing,
    trueInclination,
    trueSurfaceDistanceKm,
    trueStraightDistanceKm,
    directionError,
    distanceError,
    directionPoints,
    distancePoints,
    directionBonus: 0,
    distanceBonus: 0,
    directionExactBonus,
    distanceExactBonus,
    total: directionPoints + distancePoints + directionExactBonus + distanceExactBonus,
  };
};

/**
 * Bonus for the best of the round: 1/5 of each category's max, for the player(s)
 * who has it on that category (ties included). Only makes sense with several players — solo,
 * `results` has a single element and no one can stand out, so no bonus.
 * Compares the raw errors (`directionError`/`distanceError`), not the points: those are
 * capped at 0 as soon as you're out of tolerance, so two players both out of tolerance (and
 * thus at 0 points) would otherwise be considered tied and both "the closest".
 */
export const applyBestBonus = (results: PlayerResult[]): PlayerResult[] => {
  if (results.length < 2) return results;

  const directionBonus = Math.round(MAX_DIRECTION_POINTS * BEST_BONUS_RATIO);
  const distanceBonus = Math.round(MAX_DISTANCE_POINTS * BEST_BONUS_RATIO);
  const bestDirectionError = Math.min(...results.map((result) => result.score.directionError));
  const bestDistanceError = Math.min(...results.map((result) => result.score.distanceError));

  return results.map((result) => {
    const earnedDirectionBonus = result.score.directionError === bestDirectionError ? directionBonus : 0;
    const earnedDistanceBonus = result.score.distanceError === bestDistanceError ? distanceBonus : 0;
    return {
      ...result,
      score: {
        ...result.score,
        directionBonus: earnedDirectionBonus,
        distanceBonus: earnedDistanceBonus,
        total:
          result.score.directionPoints +
          result.score.distancePoints +
          earnedDirectionBonus +
          earnedDistanceBonus +
          result.score.directionExactBonus +
          result.score.distanceExactBonus,
      },
    };
  });
};

/** `titles` must follow the same order as RANKS (translations.endScreen.ranks). */
export const getRank = (total: number, maxTotal: number, titles: readonly string[]): Rank => {
  const ratio = maxTotal > 0 ? total / maxTotal : 0;
  const index = RANKS.findIndex((candidate) => ratio >= candidate.minRatio);
  const rank = index === -1 ? RANKS[RANKS.length - 1] : RANKS[index];
  const title = index === -1 ? titles[titles.length - 1] : titles[index];
  return { title, emoji: rank.emoji };
};
