import {
  DIRECTION_TOLERANCE_DEG,
  DISTANCE_TOLERANCE_KM,
  EXACT_DIRECTION_BONUS,
  EXACT_DISTANCE_BONUS,
  MAX_DIRECTION_POINTS,
  MAX_DISTANCE_POINTS,
  MAX_SURFACE_DISTANCE_KM,
  MIN_DISTANCE_KM,
} from '@/data/game';
import type { Coordinates, Guess, Place, PlayerResult } from '@/types';

import { bearingDeg, distanceKm, rhumbDestination } from '@/helpers/geo';
import { applyBestBonus, distanceStepKm, maxRoundScore, maxScore, roundDistance, scoreRound } from '../scoring';

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
  it('awards the full 1000 points plus both exact bonuses for a perfect guess', () => {
    const guess: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionPoints).toBe(MAX_DIRECTION_POINTS);
    expect(score.distancePoints).toBe(MAX_DISTANCE_POINTS);
    expect(score.directionExactBonus).toBe(EXACT_DIRECTION_BONUS);
    // The aimed point is on the place: the exact-distance bonus comes with it.
    expect(score.distanceExactBonus).toBe(EXACT_DISTANCE_BONUS);
    expect(score.total).toBe(MAX_DIRECTION_POINTS + MAX_DISTANCE_POINTS + EXACT_DIRECTION_BONUS + EXACT_DISTANCE_BONUS);
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

  it('does not award the exact-distance bonus when the heading is off, even with the exact distance', () => {
    const guess: Guess = { bearing: (trueBearing + 30) % 360, distanceKm: trueSurfaceKm };
    expect(scoreRound(origin, place, guess).distanceExactBonus).toBe(0);
  });

  it('awards 0 direction points for the worst possible heading error (180 degrees)', () => {
    const guess: Guess = { bearing: (trueBearing + DIRECTION_TOLERANCE_DEG) % 360, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionError).toBeCloseTo(180);
    expect(score.directionPoints).toBe(0);
    expect(score.directionExactBonus).toBe(0);
  });

  it('weights the heading points between 0 (180 degrees off) and the maximum (exact heading)', () => {
    const pointsAt = (error: number) =>
      scoreRound(origin, place, { bearing: (trueBearing + error) % 360, distanceKm: trueSurfaceKm }).directionPoints;
    expect(pointsAt(0)).toBe(MAX_DIRECTION_POINTS);
    expect(pointsAt(45)).toBeLessThan(MAX_DIRECTION_POINTS);
    expect(pointsAt(45)).toBeGreaterThan(pointsAt(90));
    expect(pointsAt(90)).toBeGreaterThan(pointsAt(135));
    expect(pointsAt(135)).toBeGreaterThan(pointsAt(180));
    expect(pointsAt(180)).toBe(0);
  });

  it('does not award the exact-heading bonus for a guess off by even half a degree', () => {
    const guess: Guess = { bearing: (trueBearing + 0.6) % 360, distanceKm: trueSurfaceKm };
    const score = scoreRound(origin, place, guess);
    expect(score.directionExactBonus).toBe(0);
  });

  it('judges the distance by the gap between the aimed point and the place: a closer point earns more', () => {
    const near: Guess = { bearing: (trueBearing + 5) % 360, distanceKm: trueSurfaceKm };
    const far: Guess = { bearing: (trueBearing + 40) % 360, distanceKm: trueSurfaceKm };
    const scoreNear = scoreRound(origin, place, near);
    const scoreFar = scoreRound(origin, place, far);
    expect(scoreNear.targetGapKm).toBeLessThan(scoreFar.targetGapKm);
    expect(scoreNear.distancePoints).toBeGreaterThan(scoreFar.distancePoints);
  });

  it('awards 0 distance points from the worst possible gap (20 000 km) and the full 500 on the place', () => {
    // A place on the opposite side of the world from the aimed point: the gap reaches the tolerance.
    const antipode: Coordinates = { latitude: -origin.latitude, longitude: origin.longitude + 180 };
    const faraway: Place = { ...place, coordinates: antipode };
    const guess: Guess = { bearing: bearingDeg(origin, antipode) + 180, distanceKm: 1 };
    const worst = scoreRound(origin, faraway, guess);
    expect(worst.targetGapKm).toBeGreaterThanOrEqual(DISTANCE_TOLERANCE_KM);
    expect(worst.distancePoints).toBe(0);
    const best = scoreRound(origin, place, { bearing: trueBearing, distanceKm: trueSurfaceKm });
    expect(best.distancePoints).toBe(MAX_DISTANCE_POINTS);
  });

  it('weights the distance points between the best gap (0 km) and the worst (20 000 km)', () => {
    const scoreAtGap = (gapKm: number) =>
      scoreRound(origin, place, { bearing: trueBearing, distanceKm: trueSurfaceKm + gapKm });
    expect(scoreAtGap(0).distancePoints).toBe(MAX_DISTANCE_POINTS);
    expect(scoreAtGap(500).distancePoints).toBeLessThan(MAX_DISTANCE_POINTS);
    expect(scoreAtGap(500).distancePoints).toBeGreaterThan(scoreAtGap(5000).distancePoints);
  });

  it('scores heading and distance with their own errors', () => {
    const wrongDistance: Guess = { bearing: trueBearing, distanceKm: trueSurfaceKm * 4 };
    const score = scoreRound(origin, place, wrongDistance);
    expect(score.directionPoints).toBe(MAX_DIRECTION_POINTS);
    expect(score.distancePoints).toBeLessThan(MAX_DISTANCE_POINTS);
  });
});

describe('scoreRound at the poles', () => {
  it('never gives NaN when the aimed point reaches a pole', () => {
    const toPole: Guess = { bearing: 175, distanceKm: MAX_SURFACE_DISTANCE_KM };
    const score = scoreRound(origin, place, toPole);
    expect(Number.isFinite(score.targetGapKm)).toBe(true);
    expect(Number.isFinite(score.distancePoints)).toBe(true);
    expect(Number.isFinite(score.total)).toBe(true);
  });
});

describe('distanceStepKm', () => {
  it('grows with the distance, as the slider does', () => {
    expect(distanceStepKm(50)).toBe(5);
    expect(distanceStepKm(500)).toBe(10);
    expect(distanceStepKm(5000)).toBe(50);
    expect(distanceStepKm(15000)).toBe(100);
  });
});

describe('targetGapKm', () => {
  const gapFor = (guess: Guess): number => scoreRound(origin, place, guess).targetGapKm;

  it('is 0 for a perfect guess', () => {
    expect(gapFor({ bearing: trueBearing, distanceKm: trueSurfaceKm })).toBeCloseTo(0, 3);
  });

  it('is large for the right distance on the opposite heading', () => {
    expect(gapFor({ bearing: (trueBearing + 180) % 360, distanceKm: trueSurfaceKm })).toBeGreaterThan(
      trueSurfaceKm / 4,
    );
  });

  it('is the rhumb distance between the aimed point and the place', () => {
    const guess: Guess = { bearing: trueBearing + 20, distanceKm: trueSurfaceKm * 0.8 };
    const aimed = rhumbDestination(origin, guess.bearing, guess.distanceKm);
    expect(gapFor(guess)).toBeCloseTo(distanceKm(aimed, place.coordinates), 6);
  });
});

describe('applyBestBonus', () => {
  const makeResult = (directionError: number, targetGapKm = 0): PlayerResult => ({
    guess: { bearing: 0, distanceKm: 100 },
    score: {
      trueBearing: 0,
      trueSurfaceDistanceKm: 100,
      directionError,
      directionPoints: 0,
      distancePoints: 0,
      directionBonus: 0,
      distanceBonus: 0,
      directionExactBonus: 0,
      distanceExactBonus: 0,
      targetGapKm,
      total: 0,
    },
  });

  it('gives no bonus to a solo player', () => {
    const results = [makeResult(0)];
    expect(applyBestBonus(results)).toEqual(results);
  });

  it('gives the heading bonus to the smallest heading error and the distance bonus to the smallest gap, independently', () => {
    const betterHeading = makeResult(5, 300);
    const betterDistance = makeResult(20, 100);
    const [a, b] = applyBestBonus([betterHeading, betterDistance]);
    expect(a.score.directionBonus).toBeGreaterThan(0);
    expect(a.score.distanceBonus).toBe(0);
    expect(b.score.directionBonus).toBe(0);
    expect(b.score.distanceBonus).toBeGreaterThan(0);
  });

  it('gives the distance bonus to the aimed point closest to the place, whatever its heading error', () => {
    const exactHeadingFar = makeResult(0, 3000);
    const nearButOffHeading = makeResult(12, 20);
    const [a, b] = applyBestBonus([exactHeadingFar, nearButOffHeading]);
    expect(a.score.directionBonus).toBeGreaterThan(0);
    expect(b.score.directionBonus).toBe(0);
    expect(b.score.distanceBonus).toBeGreaterThan(0);
  });

  it('gives the bonus to every player tied for the smallest error', () => {
    const tiedA = makeResult(10, 40);
    const tiedB = makeResult(10, 40);
    const [a, b] = applyBestBonus([tiedA, tiedB]);
    expect(a.score.directionBonus).toBeGreaterThan(0);
    expect(b.score.directionBonus).toBeGreaterThan(0);
  });

  it('folds the bonus into the total', () => {
    const [a] = applyBestBonus([makeResult(0, 0), makeResult(90, 900)]);
    expect(a.score.total).toBe(
      a.score.directionPoints + a.score.distancePoints + a.score.directionBonus + a.score.distanceBonus,
    );
  });
});

describe('a better guess never scores less', () => {
  // A small deterministic generator (no flaky test): the same thousand rounds every run.
  const generator = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const random = generator(42);

  /** A guess with a chosen heading error (degrees, either side) and distance (a ratio to the true distance, kept within what the slider can reach). */
  const guessWith = (headingError: number, ratio: number): Guess => ({
    bearing: (trueBearing + headingError + 360) % 360,
    distanceKm: Math.min(MAX_SURFACE_DISTANCE_KM, Math.max(MIN_DISTANCE_KM, trueSurfaceKm * ratio)),
  });
  const randomGuess = (): Guess =>
    guessWith(
      (random() - 0.5) * 360 * (random() < 0.3 ? 0.05 : 1),
      Math.exp((random() - 0.5) * 6 * (random() < 0.3 ? 0.05 : 1)),
    );

  /** The round of a few players, as the game scores it: each alone, then the best-of-the-round bonus. */
  const round = (guesses: Guess[]) =>
    applyBestBonus(guesses.map((guess) => ({ guess, score: scoreRound(origin, place, guess) })));

  const headingTotal = (result: PlayerResult) =>
    result.score.directionPoints + result.score.directionBonus + result.score.directionExactBonus;
  const distanceTotal = (result: PlayerResult) =>
    result.score.distancePoints + result.score.distanceBonus + result.score.distanceExactBonus;
  const isGreen = (bonus: number, exact: number) => bonus > 0 || exact > 0;

  it('on each axis, a smaller error never gets fewer points (bonuses included)', () => {
    for (let index = 0; index < 1000; index += 1) {
      const results = round([randomGuess(), randomGuess(), randomGuess()]);
      for (const a of results) {
        for (const b of results) {
          if (a.score.directionError < b.score.directionError)
            expect(headingTotal(a)).toBeGreaterThanOrEqual(headingTotal(b));
          if (a.score.targetGapKm < b.score.targetGapKm)
            expect(distanceTotal(a)).toBeGreaterThanOrEqual(distanceTotal(b));
        }
      }
    }
  });

  it('a row shown in green (a bonus) always has more points than a white row', () => {
    for (let index = 0; index < 1000; index += 1) {
      const results = round([randomGuess(), randomGuess(), randomGuess()]);
      for (const a of results) {
        for (const b of results) {
          const aGreenHeading = isGreen(a.score.directionBonus, a.score.directionExactBonus);
          const bGreenHeading = isGreen(b.score.directionBonus, b.score.directionExactBonus);
          if (aGreenHeading && !bGreenHeading) expect(headingTotal(a)).toBeGreaterThan(headingTotal(b));
          const aGreenDistance = isGreen(a.score.distanceBonus, a.score.distanceExactBonus);
          const bGreenDistance = isGreen(b.score.distanceBonus, b.score.distanceExactBonus);
          if (aGreenDistance && !bGreenDistance) expect(distanceTotal(a)).toBeGreaterThan(distanceTotal(b));
        }
      }
    }
  });

  it('the smallest distance gap wins the distance bonus and earns the most distance points', () => {
    for (let index = 0; index < 1000; index += 1) {
      const results = round([randomGuess(), randomGuess(), randomGuess()]);
      const smallest = Math.min(...results.map((result) => result.score.targetGapKm));
      const bestDistance = Math.max(...results.map(distanceTotal));
      for (const result of results) {
        if (result.score.targetGapKm === smallest) {
          expect(result.score.distanceBonus).toBeGreaterThan(0);
          expect(distanceTotal(result)).toBe(bestDistance);
        }
      }
    }
  });

  it('the smallest heading error wins the heading bonus and earns the most heading points', () => {
    for (let index = 0; index < 1000; index += 1) {
      const results = round([randomGuess(), randomGuess(), randomGuess()]);
      const smallest = Math.min(...results.map((result) => result.score.directionError));
      const bestHeading = Math.max(...results.map(headingTotal));
      for (const result of results) {
        if (result.score.directionError === smallest) {
          expect(result.score.directionBonus).toBeGreaterThan(0);
          expect(headingTotal(result)).toBe(bestHeading);
        }
      }
    }
  });

  it('a player at least as good on both axes never has a lower total for the round', () => {
    for (let index = 0; index < 1000; index += 1) {
      const results = round([randomGuess(), randomGuess(), randomGuess()]);
      for (const a of results) {
        for (const b of results) {
          if (a.score.directionError <= b.score.directionError && a.score.targetGapKm <= b.score.targetGapKm) {
            expect(a.score.total).toBeGreaterThanOrEqual(b.score.total);
          }
        }
      }
    }
  });
});

describe('maxScore', () => {
  it('counts the exact bonuses alone, and the best-of-round bonuses too with several players', () => {
    expect(maxRoundScore(1)).toBe(1200);
    expect(maxRoundScore(3)).toBe(1400);
    expect(maxScore(5, 1)).toBe(6000);
    expect(maxScore(5, 2)).toBe(7000);
  });
});
