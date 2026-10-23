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
} from '@/data/game';
import type { Coordinates, Guess, Place, PlayerResult, RoundScore } from '@/types';

import { angleDifference, bearingDeg, distanceKm, rhumbDestination } from '@/helpers/geo';
import { roundDistance } from './distanceScale';

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** SCORE_CURVE_EXPONENT;

/**
 * Note une reponse. Cap et distance sont deux axes independants, plafonnes a MAX_DIRECTION_POINTS /
 * MAX_DISTANCE_POINTS.
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
  // Bonus exact a la precision du curseur : plus la distance est grande, plus le pas est grossier (voir
  // `roundDistance`), donc "exact" = pas atteignable le plus proche.
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
 * Bonus du meilleur de la manche, par categorie : 1/5 du max pour le(s) plus petit ecart de cap
 * (`directionBonus`) et le(s) plus proche(s) du lieu (`targetGapKm`, `distanceBonus`), egalites comprises.
 * Seulement a plusieurs. Compare les ecarts bruts, pas les points (plafonnes a 0 hors tolerance : deux
 * joueurs hors tolerance seraient a egalite).
 */
export const applyBestBonus = (results: PlayerResult[]): PlayerResult[] => {
  if (results.length < 2) return results;

  const directionBonus = Math.round(MAX_DIRECTION_POINTS * BEST_BONUS_RATIO);
  const distanceBonus = Math.round(MAX_DISTANCE_POINTS * BEST_BONUS_RATIO);
  const bestDirectionError = Math.min(...results.map((result) => result.score.directionError));
  const bestTargetGap = Math.min(...results.map((result) => result.score.targetGapKm));

  return results.map((result) => {
    const earnedDirectionBonus = result.score.directionError === bestDirectionError ? directionBonus : 0;
    const earnedDistanceBonus = result.score.targetGapKm === bestTargetGap ? distanceBonus : 0;
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
