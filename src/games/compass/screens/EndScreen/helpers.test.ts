import type { Player, PlayerResult, RoundRecord } from '@/types';

import { roundBest } from './helpers';

const players: Player[] = [
  { name: 'Alice', color: '#EF4444' },
  { name: 'Bob', color: '#16A34A' },
  { name: 'Cid', color: '#0891B2' },
];

const result = (directionPoints: number, distancePoints: number): PlayerResult => ({
  guess: { bearing: 0, distanceKm: 0 },
  score: {
    trueBearing: 0,
    trueSurfaceDistanceKm: 0,
    directionError: 0,
    distanceError: 0,
    directionPoints,
    distancePoints,
    directionBonus: 0,
    distanceBonus: 0,
    directionExactBonus: 0,
    distanceExactBonus: 0,
    targetGapKm: 0,
    total: directionPoints + distancePoints,
  },
});

const recordOf = (...results: PlayerResult[]): RoundRecord => ({
  place: {
    name: 'Paris',
    code: 'FR',
    coordinates: { latitude: 0, longitude: 0 },
    category: 'cities',
    difficulty: 'easy',
  },
  results,
});

describe('roundBest', () => {
  const record = recordOf(result(300, 100), result(450, 100), result(200, 400));

  it('is the player with the most points on the criterion, and how many', () => {
    expect(roundBest(record, players, 'directionPoints')).toEqual({ players: [players[1]], points: 450 });
    expect(roundBest(record, players, 'distancePoints')).toEqual({ players: [players[2]], points: 400 });
  });

  it('names everybody who ties for the top score', () => {
    const tied = recordOf(result(300, 100), result(300, 100), result(200, 100));
    expect(roundBest(tied, players, 'directionPoints')?.players).toEqual([players[0], players[1]]);
    expect(roundBest(tied, players, 'distancePoints')?.players).toEqual(players);
  });

  it('is null when nobody scored on the criterion', () => {
    const none = recordOf(result(0, 0), result(0, 0));
    expect(roundBest(none, players, 'directionPoints')).toBeNull();
    expect(roundBest(recordOf(), players, 'distancePoints')).toBeNull();
  });

  it('ignores a result whose player has left the room', () => {
    // Three results, two players left: the third player (best on distance) is gone.
    expect(roundBest(record, players.slice(0, 2), 'distancePoints')).toEqual({
      players: [players[0], players[1]],
      points: 100,
    });
  });
});
