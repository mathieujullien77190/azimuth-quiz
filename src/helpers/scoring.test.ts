import { EXACT_DIRECTION_BONUS, EXACT_DISTANCE_BONUS, MAX_DIRECTION_POINTS, MAX_DISTANCE_POINTS, MAX_SURFACE_DISTANCE_KM, RANKS } from '@/constants';
import type { Coordinates, Guess, Place, PlayerResult } from '@/types';

import { roundDistance } from './distanceScale';
import { bearingDeg, distanceKm } from './geo';
import { applyBestBonus, getRank, scoreRound } from './scoring';

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
    const guess: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.directionPoints).toBe(MAX_DIRECTION_POINTS);
    expect(score.distancePoints).toBe(MAX_DISTANCE_POINTS);
    expect(score.directionExactBonus).toBe(EXACT_DIRECTION_BONUS);
    // The raw true distance essentially never lands exactly on a slider-reachable step.
    expect(score.distanceExactBonus).toBe(0);
    expect(score.total).toBe(MAX_DIRECTION_POINTS + MAX_DISTANCE_POINTS + EXACT_DIRECTION_BONUS);
  });

  it('awards the exact-distance bonus when the guess lands on the closest step the slider can reach', () => {
    const onStepGuess = roundDistance(trueSurfaceKm, MAX_SURFACE_DISTANCE_KM);
    const guess: Guess = { bearing: trueBearing, distanceKm: onStepGuess, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.distanceExactBonus).toBe(EXACT_DISTANCE_BONUS);
    expect(score.total).toBe(score.directionPoints + score.distancePoints + score.directionExactBonus + EXACT_DISTANCE_BONUS);
  });

  it('does not award the exact-distance bonus for a guess one step off', () => {
    const onStepGuess = roundDistance(trueSurfaceKm, MAX_SURFACE_DISTANCE_KM);
    const guess: Guess = { bearing: trueBearing, distanceKm: onStepGuess * 1.5, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.distanceExactBonus).toBe(0);
  });

  it('awards 0 direction points for a guess opposite the true bearing', () => {
    const guess: Guess = { bearing: (trueBearing + 180) % 360, distanceKm: trueSurfaceKm, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.directionPoints).toBe(0);
    expect(score.directionExactBonus).toBe(0);
  });

  it('does not award the exact-heading bonus for a guess off by even half a degree', () => {
    const guess: Guess = { bearing: (trueBearing + 0.6) % 360, distanceKm: trueSurfaceKm, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.directionExactBonus).toBe(0);
  });

  it('awards 0 distance points when the guess is far outside the tolerance ratio', () => {
    const guess: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm * 100, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.distancePoints).toBe(0);
  });

  it('compares against the chord distance in straightLine mode, not the surface distance', () => {
    const guess: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm, inclination: 0 };
    const surfaceScore = scoreRound(origin, place, guess, { straightLine: false });
    const straightScore = scoreRound(origin, place, guess, { straightLine: true });
    // Same heading, same guessed distance, but compared against a different truth (chord != surface).
    expect(straightScore.distancePoints).not.toBe(surfaceScore.distancePoints);
    expect(straightScore.trueStraightDistanceKm).toBeLessThanOrEqual(straightScore.trueSurfaceDistanceKm);
  });

  it('scores direction and distance independently', () => {
    const guess: Guess = { bearing: (trueBearing + 180) % 360, distanceKm: trueSurfaceKm, inclination: 0 };
    const score = scoreRound(origin, place, guess, { straightLine: false });
    expect(score.directionPoints).toBe(0);
    expect(score.distancePoints).toBe(MAX_DISTANCE_POINTS);
  });
});

describe('applyBestBonus', () => {
  const makeResult = (directionError: number, distanceError: number): PlayerResult => ({
    guess: { bearing: 0, distanceKm: 100, inclination: 0 },
    score: {
      trueBearing: 0,
      trueInclination: 0,
      trueSurfaceDistanceKm: 100,
      trueStraightDistanceKm: 100,
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

  it('gives the bonus to whoever is closest on each axis independently', () => {
    const closer = makeResult(5, 50);
    const farther = makeResult(20, 10);
    const [a, b] = applyBestBonus([closer, farther]);
    expect(a.score.directionBonus).toBeGreaterThan(0);
    expect(a.score.distanceBonus).toBe(0);
    expect(b.score.directionBonus).toBe(0);
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
    expect(a.score.total).toBe(a.score.directionPoints + a.score.distancePoints + a.score.directionBonus + a.score.distanceBonus);
  });
});

describe('getRank', () => {
  const titles = RANKS.map((_, index) => `title-${index}`);

  it('picks the top rank at a perfect ratio', () => {
    expect(getRank(1000, 1000, titles).title).toBe('title-0');
  });

  it('picks the lowest rank at ratio 0', () => {
    expect(getRank(0, 1000, titles).title).toBe(titles[titles.length - 1]);
  });

  it('falls back to the lowest rank when maxTotal is 0 (avoids a division by 0)', () => {
    expect(getRank(0, 0, titles).title).toBe(titles[titles.length - 1]);
  });

  it('picks a middle rank for a middling ratio', () => {
    const rank = getRank(550, 1000, titles);
    expect(titles).toContain(rank.title);
  });

  it('falls back to the lowest rank for a negative ratio (defensive, should not happen in practice)', () => {
    expect(getRank(-100, 1000, titles).title).toBe(titles[titles.length - 1]);
  });
});
