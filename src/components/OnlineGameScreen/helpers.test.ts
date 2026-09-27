import type { RoomPlayers } from '@/helpers/room';
import type { RoundScore } from '@/types';

import { buildRoundRecord, onlinePlayersFrom } from './helpers';

const score = (total: number): RoundScore => ({
  trueBearing: 0,
  trueInclination: 0,
  trueSurfaceDistanceKm: 0,
  trueStraightDistanceKm: 0,
  directionError: 0,
  distanceError: 0,
  directionPoints: 0,
  distancePoints: 0,
  directionBonus: 0,
  distanceBonus: 0,
  directionExactBonus: 0,
  distanceExactBonus: 0,
  total,
});

const place = {
  name: 'Paris',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  code: 'FR',
  category: 'capital' as const,
  difficulty: 'easy' as const,
};

describe('onlinePlayersFrom', () => {
  it('sorts by arrival order, earliest first', () => {
    const players: RoomPlayers = {
      guest: { name: 'Max', joinedAt: { toMillis: () => 2 } as never, color: '#16A34A' },
      host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } as never, color: '#EF4444' },
    };
    expect(onlinePlayersFrom(players)).toEqual([
      { uid: 'host', name: 'Zoé', color: '#EF4444' },
      { uid: 'guest', name: 'Max', color: '#16A34A' },
    ]);
  });

  it('sorts a not-yet-synced joinedAt (null) last, not first', () => {
    const players: RoomPlayers = {
      guest: { name: 'Max', joinedAt: null },
      host: { name: 'Zoé', joinedAt: { toMillis: () => 1 } as never, color: '#EF4444' },
    };
    expect(onlinePlayersFrom(players).map((player) => player.uid)).toEqual(['host', 'guest']);
  });

  it('falls back to the first palette color when the host hasn’t assigned one yet', () => {
    const players: RoomPlayers = { host: { name: 'Zoé', joinedAt: null } };
    expect(onlinePlayersFrom(players)[0].color).toBe('#EF4444');
  });
});

describe('buildRoundRecord', () => {
  const onlinePlayers = [
    { uid: 'host', name: 'Zoé', color: '#EF4444' },
    { uid: 'guest', name: 'Max', color: '#16A34A' },
  ];

  it('pairs each player with its own guess and score, in onlinePlayers order', () => {
    const guesses = {
      host: { bearing: 10, distanceKm: 100, inclination: 0 },
      guest: { bearing: 20, distanceKm: 200, inclination: 0 },
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
      { host: { bearing: 10, distanceKm: 100, inclination: 0 } },
      { host: score(300) },
    );
    expect(record.results[1].guess).toEqual({ bearing: 0, distanceKm: 0, inclination: 0 });
    expect(record.results[1].score.total).toBe(0);
  });
});
