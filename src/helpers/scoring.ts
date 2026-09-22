import {
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_RATIO,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  RANKS,
  SCORE_CURVE_EXPONENT,
} from '@/constants';
import type { Coordinates, GameSettings, Guess, Place, Rank, RoundScore } from '@/types';

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
    total: directionPoints + distancePoints,
  };
};

export const getRank = (total: number, maxTotal: number): Rank => {
  const ratio = maxTotal > 0 ? total / maxTotal : 0;
  const rank = RANKS.find((candidate) => ratio >= candidate.minRatio) ?? RANKS[RANKS.length - 1];
  return { title: rank.title, emoji: rank.emoji };
};
