import {
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_RATIO,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  RANKS,
  SCORE_CURVE_EXPONENT,
} from '@/constants';
import type { Coordinates, Guess, Place, Rank, RoundScore } from '@/types';

import {
  angleDifference,
  bearingDeg,
  directionAngle,
  distanceKm,
  inclinationDeg,
  inclinationFromChordKm,
  straightDistanceKm,
} from './geo';

const curve = (ratio: number): number => Math.max(0, Math.min(1, ratio)) ** SCORE_CURVE_EXPONENT;

/**
 * Score une reponse. La comparaison (surface ou ligne droite) suit `guess.distanceMode` :
 * c'est le dernier curseur touche par le joueur (Distance ou Inclinaison) qui decide.
 */
export const scoreRound = (origin: Coordinates, place: Place, guess: Guess): RoundScore => {
  const trueBearing = bearingDeg(origin, place.coordinates);
  const trueInclination = inclinationDeg(origin, place.coordinates);
  const trueSurfaceDistanceKm = distanceKm(origin, place.coordinates);
  const trueStraightDistanceKm = straightDistanceKm(origin, place.coordinates);
  const isStraight = guess.distanceMode === 'straight';
  const guessDistanceKm = isStraight ? guess.straightKm : guess.surfaceKm;
  const guessInclination = isStraight ? inclinationFromChordKm(guess.straightKm) : 0;
  const trueDistanceForGuess = isStraight ? trueStraightDistanceKm : trueSurfaceDistanceKm;

  const directionError = isStraight
    ? directionAngle(guess.bearing, guessInclination, trueBearing, trueInclination)
    : angleDifference(guess.bearing, trueBearing);
  const directionPoints = Math.round(MAX_DIRECTION_POINTS * curve(1 - directionError / DIRECTION_TOLERANCE_DEG));

  const distanceError = Math.abs(Math.log(guessDistanceKm / trueDistanceForGuess));
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
