import {
  BEST_BONUS_RATIO,
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_KM,
  EXACT_DIRECTION_BONUS,
  EXACT_DISTANCE_BONUS,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  MIN_DISTANCE_KM,
  SCORE_CURVE_EXPONENT,
} from '@/data/game';
import type { Coordinates, Guess, Place, PlayerResult, RoundScore } from '@/types';

import { angleDifference, bearingDeg, distanceKm, rhumbDestination } from '@/helpers/geo';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Pas du curseur de distance autour de `km` (plus grand pour les grandes distances). */
export const distanceStepKm = (km: number): number => (km < 100 ? 5 : km < 1000 ? 10 : km < 10000 ? 50 : 100);

/** Arrondit a un pas lisible (`distanceStepKm`) ; c'est aussi la precision atteignable par le curseur. */
export const roundDistance = (km: number, maxKm: number): number => {
  const step = distanceStepKm(km);
  return Math.min(maxKm, Math.max(MIN_DISTANCE_KM, Math.round(km / step) * step));
};

/**
 * Position [0, 1] sur le curseur logarithmique -> km. Pas d'arrondi aux extremes : le maximum doit rester
 * atteignable.
 */
export const ratioToKm = (ratio: number, maxKm: number): number => {
  const clamped = clamp01(ratio);
  if (clamped >= 1) return maxKm;
  if (clamped <= 0) return MIN_DISTANCE_KM;
  return roundDistance(MIN_DISTANCE_KM * Math.exp(Math.log(maxKm / MIN_DISTANCE_KM) * clamped), maxKm);
};

/** km -> position [0, 1] sur le curseur logarithmique. */
export const kmToRatio = (km: number, maxKm: number): number =>
  clamp01(Math.log(km / MIN_DISTANCE_KM) / Math.log(maxKm / MIN_DISTANCE_KM));

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** SCORE_CURVE_EXPONENT;

/**
 * Note une reponse sur deux axes plafonnes a MAX_DIRECTION_POINTS / MAX_DISTANCE_POINTS : le cap (ecart de cap, 0 point
 * au pire possible, 180 degres) et la distance, jugee par l'ecart entre le point devine et le vrai lieu (`targetGapKm`,
 * 0 point au pire possible). Dans les deux cas, plus l'ecart est petit, plus il y a de points.
 */
export const scoreRound = (origin: Coordinates, place: Place, guess: Guess): RoundScore => {
  const trueBearing = bearingDeg(origin, place.coordinates);
  const trueSurfaceDistanceKm = distanceKm(origin, place.coordinates);

  const directionError = angleDifference(guess.bearing, trueBearing);
  const directionPoints = Math.round(MAX_DIRECTION_POINTS * curve(1 - directionError / DIRECTION_TOLERANCE_DEG));
  const directionExactBonus = Math.round(directionError) === 0 ? EXACT_DIRECTION_BONUS : 0;

  const targetGapKm = distanceKm(rhumbDestination(origin, guess.bearing, guess.distanceKm), place.coordinates);
  const distancePoints = Math.round(MAX_DISTANCE_POINTS * curve(1 - targetGapKm / DISTANCE_TOLERANCE_KM));
  // Bonus exact: le point devine tombe a moins d'un demi-pas du curseur du vrai lieu (cap et distance justes).
  const distanceExactBonus = targetGapKm <= distanceStepKm(trueSurfaceDistanceKm) / 2 ? EXACT_DISTANCE_BONUS : 0;

  return {
    trueBearing,
    trueSurfaceDistanceKm,
    directionError,
    directionPoints,
    distancePoints,
    directionBonus: 0,
    distanceBonus: 0,
    directionExactBonus,
    distanceExactBonus,
    targetGapKm,
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

/**
 * Score maximum d'une manche : les deux axes a fond plus les deux bonus d'exactitude, et a plusieurs les deux
 * bonus du meilleur de la manche (un seul joueur ne les touche jamais).
 */
export const maxRoundScore = (playerCount: number): number => {
  const exact = MAX_DIRECTION_POINTS + MAX_DISTANCE_POINTS + EXACT_DIRECTION_BONUS + EXACT_DISTANCE_BONUS;
  if (playerCount < 2) return exact;
  return exact + Math.round(MAX_DIRECTION_POINTS * BEST_BONUS_RATIO) + Math.round(MAX_DISTANCE_POINTS * BEST_BONUS_RATIO);
};

/** Score maximum d'une partie de `rounds` manches. */
export const maxScore = (rounds: number, playerCount: number): number => rounds * maxRoundScore(playerCount);
