import {
  EXACT_DIRECTION_BONUS,
  EXACT_DISTANCE_BONUS,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  MAX_SURFACE_DISTANCE_KM,
} from '@/games/compass/constants';
import type { Coordinates, Guess, Place, PlayerResult } from '@/types';

import { roundDistance } from './distanceScale';
import { bearingDeg, distanceKm } from '@/helpers/geo';
import { destinationPoint } from '@/components/Globe3D/helpers';
import { applyBestBonus, guessGapKm, scoreRound } from './scoring';

const origin: Coordinates = { latitude: 48.8566, longitude: 2.3522 };
const place: Place = {
  name: 'Tokyo',
  code: 'JP',
  coordinates: { latitude: 35.6762, longitude: 139.6503 },
  category: 'cities',
  difficulty: 'easy',
};

const trueBearing = bearingDeg(origin, place.coordinates);
const trueSurfaceKm = distanceKm(origin, place.coordinates);

describe('scoreRound', () => {
  it('awards the full 1000 points plus the exact-heading bonus for a perfect guess (surface mode)', () => {
    const guess: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionPoints).toBe(MAX_DIRECTION_POINTS);
    expect(score.distancePoints).toBe(MAX_DISTANCE_POINTS);
    expect(score.directionExactBonus).toBe(EXACT_DIRECTION_BONUS);
    // The raw true distance essentially never lands exactly on a slider-reachable step.
    expect(score.distanceExactBonus).toBe(0);
    expect(score.total).toBe(MAX_DIRECTION_POINTS + MAX_DISTANCE_POINTS + EXACT_DIRECTION_BONUS);
  });

  it('awards the exact-distance bonus when the guess lands on the closest step the slider can reach', () => {
    const onStepGuess = roundDistance(trueSurfaceKm, MAX_SURFACE_DISTANCE_KM);
    const guess: Guess = { bearing: trueBearing, distanceKm: onStepGuess };
    const score = scoreRound(origin, place, guess);
    expect(score.distanceExactBonus).toBe(EXACT_DISTANCE_BONUS);
    expect(score.total).toBe(
      score.directionPoints + score.distancePoints + score.directionExactBonus + EXACT_DISTANCE_BONUS,
    );
  });

  it('does not award the exact-distance bonus for a guess one step off', () => {
    const onStepGuess = roundDistance(trueSurfaceKm, MAX_SURFACE_DISTANCE_KM);
    const guess: Guess = { bearing: trueBearing, distanceKm: onStepGuess * 1.5 };
    const score = scoreRound(origin, place, guess);
    expect(score.distanceExactBonus).toBe(0);
  });

  it('awards 0 direction points for a guess opposite the true bearing', () => {
    const guess: Guess = { bearing: (trueBearing + 180) % 360, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionPoints).toBe(0);
    expect(score.directionExactBonus).toBe(0);
  });

  it('does not award the exact-heading bonus for a guess off by even half a degree', () => {
    const guess: Guess = { bearing: (trueBearing + 0.6) % 360, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionExactBonus).toBe(0);
  });

  it('awards 0 distance points when the guess is far outside the tolerance ratio', () => {
    const guess: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm * 100 };
    const score = scoreRound(origin, place, guess);
    expect(score.distancePoints).toBe(0);
  });

  it('scores direction and distance independently', () => {
    const guess: Guess = { bearing: (trueBearing + 180) % 360, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionPoints).toBe(0);
    expect(score.distancePoints).toBe(MAX_DISTANCE_POINTS);
  });
});

describe('guessGapKm', () => {
  const resultFor = (guess: Guess): PlayerResult => ({ guess, score: scoreRound(origin, place, guess) });

  it('is 0 for a perfect guess', () => {
    expect(guessGapKm(resultFor({ bearing: trueBearing, distanceKm: trueSurfaceKm }))).toBeCloseTo(0, 3);
  });

  it('is large for the right distance on the opposite heading', () => {
    expect(guessGapKm(resultFor({ bearing: (trueBearing + 180) % 360, distanceKm: trueSurfaceKm }))).toBeGreaterThan(
      trueSurfaceKm,
    );
  });

  it('matches the real distance between the aimed point and the place', () => {
    const guess: Guess = { bearing: trueBearing + 20, distanceKm: trueSurfaceKm * 0.8 };
    const aimed = destinationPoint(origin, guess.bearing, guess.distanceKm);
    expect(guessGapKm(resultFor(guess))).toBeCloseTo(distanceKm(aimed, place.coordinates), 0);
  });

  it('clamps rounding noise instead of returning NaN', () => {
    expect(guessGapKm(resultFor({ bearing: trueBearing, distanceKm: trueSurfaceKm }))).not.toBeNaN();
  });
});

describe('applyBestBonus', () => {
  const makeResult = (directionError: number, distanceError: number): PlayerResult => ({
    guess: { bearing: 0, distanceKm: 100 },
    score: {
      trueBearing: 0,
      trueSurfaceDistanceKm: 100,
      directionError,
      distanceError,
      directionPoints: 0,
      distancePoints: 0,
      directionBonus: 0,
      distanceBonus: 0,
      directionExactBonus: 0,
      distanceExactBonus: 0,
      total: 0,
    },
  });

  it('gives no bonus to a solo player', () => {
    const results = [makeResult(0, 0)];
    expect(applyBestBonus(results)).toEqual(results);
  });

  it('gives both bonuses to whoever aimed closest to the place, not to the best on one axis', () => {
    // Right distance but opposite heading: lands on the other side of the origin.
    const oppositeRightDistance = makeResult(180, 0);
    // Slightly off on both axes, but close to the place.
    const nearMiss = { ...makeResult(5, 50), guess: { bearing: 5, distanceKm: 120 } };
    const [a, b] = applyBestBonus([oppositeRightDistance, nearMiss]);
    expect(a.score.directionBonus).toBe(0);
    expect(a.score.distanceBonus).toBe(0);
    expect(b.score.directionBonus).toBeGreaterThan(0);
    expect(b.score.distanceBonus).toBeGreaterThan(0);
  });

  it('gives the bonus to every player tied for closest', () => {
    const tiedA = makeResult(10, 10);
    const tiedB = makeResult(10, 10);
    const [a, b] = applyBestBonus([tiedA, tiedB]);
    expect(a.score.directionBonus).toBeGreaterThan(0);
    expect(b.score.directionBonus).toBeGreaterThan(0);
  });

  it('folds the bonus into the total', () => {
    const [a] = applyBestBonus([makeResult(0, 0), makeResult(90, 90)]);
    expect(a.score.total).toBe(
      a.score.directionPoints + a.score.distancePoints + a.score.directionBonus + a.score.distanceBonus,
    );
  });
});
