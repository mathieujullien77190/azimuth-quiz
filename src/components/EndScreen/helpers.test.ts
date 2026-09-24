import { MAX_ROUND_POINTS } from '@/constants';
import type { Player, PlayerResult, RoundRecord } from '@/types';

import { maxTotalScore, rankPlayers, roundWinnerIndex, winnerTitle } from './helpers';
import type { RankedPlayer } from './types';

const players: Player[] = [
  { name: 'Alice', color: '#EF4444' },
  { name: 'Bob', color: '#16A34A' },
  { name: 'Cid', color: '#0891B2' },
];

const result = (total: number): PlayerResult => ({
  guess: { bearing: 0, distanceKm: 0, inclination: 0 },
  score: {
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
  },
});

describe('maxTotalScore', () => {
  it('is rounds * MAX_ROUND_POINTS', () => {
    const records = [{} as RoundRecord, {} as RoundRecord, {} as RoundRecord];
    expect(maxTotalScore(records)).toBe(3 * MAX_ROUND_POINTS);
  });

  it('is 0 for no rounds', () => {
    expect(maxTotalScore([])).toBe(0);
  });
});

describe('rankPlayers', () => {
  it('ranks by descending total', () => {
    const ranking = rankPlayers(players, [100, 300, 200]);
    expect(ranking.map((r) => r.player.name)).toEqual(['Bob', 'Cid', 'Alice']);
    expect(ranking.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('gives tied players the same rank', () => {
    const ranking = rankPlayers(players, [300, 300, 100]);
    const [first, second, third] = ranking;
    expect(first.rank).toBe(1);
    expect(second.rank).toBe(1);
    expect(third.rank).toBe(3);
  });

  it('defaults a missing total to 0', () => {
    const ranking = rankPlayers(players, [100]);
    expect(ranking.find((r) => r.player.name === 'Cid')?.total).toBe(0);
  });
});

describe('winnerTitle', () => {
  it('names the single winner', () => {
    const ranking: RankedPlayer[] = [
      { player: players[0], total: 300, rank: 1 },
      { player: players[1], total: 100, rank: 2 },
    ];
    const t = { and: 'et', tie: (names: string) => `Egalite : ${names}`, winner: (name: string) => `${name} gagne !` };
    expect(winnerTitle(ranking, t as never)).toBe('Alice gagne !');
  });

  it('joins tied winners with "and"', () => {
    const ranking: RankedPlayer[] = [
      { player: players[0], total: 300, rank: 1 },
      { player: players[1], total: 300, rank: 1 },
    ];
    const t = { and: 'et', tie: (names: string) => `Egalite : ${names}`, winner: (name: string) => `${name} gagne !` };
    expect(winnerTitle(ranking, t as never)).toBe('Egalite : Alice et Bob');
  });
});

describe('roundWinnerIndex', () => {
  it('picks the highest score', () => {
    const record: RoundRecord = { place: {} as RoundRecord['place'], results: [result(100), result(300), result(200)] };
    expect(roundWinnerIndex(record)).toBe(1);
  });

  it('picks the first player on a tie', () => {
    const record: RoundRecord = { place: {} as RoundRecord['place'], results: [result(300), result(300)] };
    expect(roundWinnerIndex(record)).toBe(0);
  });
});
