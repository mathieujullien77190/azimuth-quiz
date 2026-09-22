import {
  BEST_BONUS_RATIO,
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_RATIO,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  RANKS,
  SCORE_CURVE_EXPONENT,
} from '@/constants';
import type { Coordinates, GameSettings, Guess, Place, PlayerResult, Rank, RoundScore } from '@/types';

import { angleDifference, bearingDeg, distanceKm, inclinationDeg, straightDistanceKm } from './geo';

export type ScoringOptions = Pick<GameSettings, 'straightLine'>;

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** SCORE_CURVE_EXPONENT;

/**
 * Score une reponse. Direction (cap) et distance/inclinaison sont deux axes independants, chacun
 * plafonne a MAX_DIRECTION_POINTS / MAX_DISTANCE_POINTS : un cap parfait donne les 500 points de
 * direction quelle que soit l'inclinaison choisie, et reciproquement. En mode "straightLine", la
 * comparaison de distance se fait sur la corde (donc sur l'inclinaison), jamais melangee au cap.
 */
export const scoreRound = (origin: Coordinates, place: Place, guess: Guess, options: ScoringOptions): RoundScore => {
  const trueBearing = bearingDeg(origin, place.coordinates);
  const trueInclination = inclinationDeg(origin, place.coordinates);
  const trueSurfaceDistanceKm = distanceKm(origin, place.coordinates);
  const trueStraightDistanceKm = straightDistanceKm(origin, place.coordinates);
  const trueDistanceForGuess = options.straightLine ? trueStraightDistanceKm : trueSurfaceDistanceKm;

  const directionError = angleDifference(guess.bearing, trueBearing);
  const directionPoints = Math.round(MAX_DIRECTION_POINTS * curve(1 - directionError / DIRECTION_TOLERANCE_DEG));

  const distanceError = Math.abs(Math.log(guess.distanceKm / trueDistanceForGuess));
  const distancePoints = Math.round(
    MAX_DISTANCE_POINTS * curve(1 - distanceError / Math.log(DISTANCE_TOLERANCE_RATIO)),
  );

  return {
    trueBearing,
    trueInclination,
    trueSurfaceDistanceKm,
    trueStraightDistanceKm,
    directionError,
    directionPoints,
    distancePoints,
    directionBonus: 0,
    distanceBonus: 0,
    total: directionPoints + distancePoints,
  };
};

/**
 * Bonus du(des) meilleur(s) de la manche : 1/5 du max de chaque categorie, pour le(s) joueur(s)
 * qui l'a(ont) sur cette categorie (egalite comprise). N'a de sens qu'a plusieurs — en solo,
 * `results` a un seul element et personne ne peut se distinguer, donc aucun bonus.
 */
export const applyBestBonus = (results: PlayerResult[]): PlayerResult[] => {
  if (results.length < 2) return results;

  const directionBonus = Math.round(MAX_DIRECTION_POINTS * BEST_BONUS_RATIO);
  const distanceBonus = Math.round(MAX_DISTANCE_POINTS * BEST_BONUS_RATIO);
  const bestDirectionPoints = Math.max(...results.map((result) => result.score.directionPoints));
  const bestDistancePoints = Math.max(...results.map((result) => result.score.distancePoints));

  return results.map((result) => {
    const earnedDirectionBonus = result.score.directionPoints === bestDirectionPoints ? directionBonus : 0;
    const earnedDistanceBonus = result.score.distancePoints === bestDistancePoints ? distanceBonus : 0;
    return {
      ...result,
      score: {
        ...result.score,
        directionBonus: earnedDirectionBonus,
        distanceBonus: earnedDistanceBonus,
        total: result.score.directionPoints + result.score.distancePoints + earnedDirectionBonus + earnedDistanceBonus,
      },
    };
  });
};

/** `titles` doit suivre le meme ordre que RANKS (translations.endScreen.ranks). */
export const getRank = (total: number, maxTotal: number, titles: readonly string[]): Rank => {
  const ratio = maxTotal > 0 ? total / maxTotal : 0;
  const index = RANKS.findIndex((candidate) => ratio >= candidate.minRatio);
  const rank = index === -1 ? RANKS[RANKS.length - 1] : RANKS[index];
  const title = index === -1 ? titles[titles.length - 1] : titles[index];
  return { title, emoji: rank.emoji };
};
