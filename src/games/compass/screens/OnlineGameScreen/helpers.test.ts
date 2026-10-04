import type { RoundScore } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE } from './constants';
import { formatDistance, kmToRatio } from '@/helpers';

import { buildRoundRecord, compassSizeFor, distanceSliderMarks, earthSizeFor } from './helpers';

const score = (total: number): RoundScore => ({
  trueBearing: 0,
  trueSurfaceDistanceKm: 0,
  directionError: 0,
  distanceError: 0,
  directionPoints: 0,
  distancePoints: 0,
  directionBonus: 0,
  distanceBonus: 0,
  directionExactBonus: 0,
  distanceExactBonus: 0,
  targetGapKm: 0,
  total,
});

const place = {
  name: 'Paris',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  code: 'FR',
  category: 'capital' as const,
  difficulty: 'easy' as const,
};

describe('buildRoundRecord', () => {
  const onlinePlayers = [
    { uid: 'host', name: 'Zoé', color: '#EF4444' },
    { uid: 'guest', name: 'Max', color: '#16A34A' },
  ];

  it('pairs each player with its own guess and score, in onlinePlayers order', () => {
    const guesses = {
      host: { bearing: 10, distanceKm: 100 },
      guest: { bearing: 20, distanceKm: 200 },
    };
    const scores = { host: score(300), guest: score(400) };
    const record = buildRoundRecord(place, onlinePlayers, guesses, scores);
    expect(record.place).toBe(place);
    expect(record.results).toEqual([
      { guess: guesses.host, score: scores.host },
      { guess: guesses.guest, score: scores.guest },
    ]);
  });

  it('falls back to a zeroed guess/score for a player missing from either map (left mid-round)', () => {
    const record = buildRoundRecord(
      place,
      onlinePlayers,
      { host: { bearing: 10, distanceKm: 100 } },
      { host: score(300) },
    );
    expect(record.results[1].guess).toEqual({ bearing: 0, distanceKm: 0 });
    expect(record.results[1].score.total).toBe(0);
  });
});

describe('compassSizeFor', () => {
  it('fits within the window width', () => {
    expect(compassSizeFor(400)).toBeLessThan(400);
  });

  it('caps at MAX_COMPASS_SIZE for a wide window', () => {
    expect(compassSizeFor(4000)).toBe(MAX_COMPASS_SIZE);
  });

  it('falls back to MAX_COMPASS_SIZE when the computed size would be <= 0', () => {
    expect(compassSizeFor(0)).toBe(MAX_COMPASS_SIZE);
  });
});

describe('earthSizeFor', () => {
  it('fits within the window width', () => {
    expect(earthSizeFor(400)).toBeLessThan(400);
  });

  it('caps at MAX_EARTH_SIZE for a wide window', () => {
    expect(earthSizeFor(4000)).toBe(MAX_EARTH_SIZE);
  });

  it('falls back to MAX_EARTH_SIZE when the computed size would be <= 0', () => {
    expect(earthSizeFor(0)).toBe(MAX_EARTH_SIZE);
  });
});

describe('distanceSliderMarks', () => {
  it('keeps only the reference distances below the maximum, placed on the logarithmic scale', () => {
    const marks = distanceSliderMarks(5000);
    expect(marks.map((mark) => mark.label)).toEqual([formatDistance(100), formatDistance(1000)]);
    expect(marks[0].ratio).toBeCloseTo(kmToRatio(100, 5000));
  });

  it('shows them all for the full surface scale', () => {
    expect(distanceSliderMarks(20000)).toHaveLength(3);
  });
});
