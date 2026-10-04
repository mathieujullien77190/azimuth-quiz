import {
  BEST_BONUS_RATIO,
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_RATIO,
  EXACT_DIRECTION_BONUS,
  EXACT_DISTANCE_BONUS,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  MAX_SURFACE_DISTANCE_KM,
  SCORE_CURVE_EXPONENT,
} from '@/games/compass/constants';
import type { Coordinates, Guess, Place, PlayerResult, RoundScore } from '@/types';

import { angleDifference, bearingDeg, distanceKm, rhumbDestination } from '@/helpers/geo';
import { roundDistance } from './distanceScale';

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** SCORE_CURVE_EXPONENT;

/**
 * Scores an answer. Direction (heading) and distance are two independent axes, each capped at
 * MAX_DIRECTION_POINTS / MAX_DISTANCE_POINTS: a perfect heading gives the full 500 direction
 * points regardless of the chosen distance, and vice versa.
 */
export const scoreRound = (origin: Coordinates, place: Place, guess: Guess): RoundScore => {
  const trueBearing = bearingDeg(origin, place.coordinates);
  const trueSurfaceDistanceKm = distanceKm(origin, place.coordinates);

  const directionError = angleDifference(guess.bearing, trueBearing);
  const directionPoints = Math.round(MAX_DIRECTION_POINTS * curve(1 - directionError / DIRECTION_TOLERANCE_DEG));
  const directionExactBonus = Math.round(directionError) === 0 ? EXACT_DIRECTION_BONUS : 0;

  const distanceError = Math.abs(Math.log(guess.distanceKm / trueSurfaceDistanceKm));
  const distancePoints = Math.round(
    MAX_DISTANCE_POINTS * curve(1 - distanceError / Math.log(DISTANCE_TOLERANCE_RATIO)),
  );
  // Exact bonus at the slider's own precision: the bigger the true distance, the coarser the
  // step it can actually be set to (see `roundDistance`), so "exact" means landing on the
  // closest reachable step, not matching the true value bit-for-bit.
  const distanceExactBonus =
    roundDistance(trueSurfaceDistanceKm, MAX_SURFACE_DISTANCE_KM) === guess.distanceKm ? EXACT_DISTANCE_BONUS : 0;

  return {
    trueBearing,
    trueSurfaceDistanceKm,
    directionError,
    distanceError,
    directionPoints,
    distancePoints,
    directionBonus: 0,
    distanceBonus: 0,
    directionExactBonus,
    distanceExactBonus,
    targetGapKm: distanceKm(rhumbDestination(origin, guess.bearing, guess.distanceKm), place.coordinates),
    total: directionPoints + distancePoints + directionExactBonus + distanceExactBonus,
  };
};

/**
 * Bonus for the winner of the round: the player(s) whose guessed point (heading + distance) is
 * closest to the true place (ties included) get 1/5 of each category's max. Only makes sense with
 * several players — solo, `results` has a single element and no one can stand out, so no bonus.
 * Compares the gap to the place, not the points: those are capped at 0 as soon as you're out of
 * tolerance, so two players both out of tolerance would otherwise be tied.
 */
export const applyBestBonus = (results: PlayerResult[]): PlayerResult[] => {
  if (results.length < 2) return results;

  const directionBonus = Math.round(MAX_DIRECTION_POINTS * BEST_BONUS_RATIO);
  const distanceBonus = Math.round(MAX_DISTANCE_POINTS * BEST_BONUS_RATIO);
  const bestGap = Math.min(...results.map((result) => result.score.targetGapKm));

  return results.map((result) => {
    const isWinner = result.score.targetGapKm === bestGap;
    const earnedDirectionBonus = isWinner ? directionBonus : 0;
    const earnedDistanceBonus = isWinner ? distanceBonus : 0;
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
