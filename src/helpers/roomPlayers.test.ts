import type { RoomPlayers } from './roomBase';
import { nextPlayerUid, onlinePlayersFrom, playersForRound } from './roomPlayers';

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

const players = [
  { uid: 'a', name: 'Zoé', color: '#EF4444' },
  { uid: 'b', name: 'Max', color: '#16A34A' },
  { uid: 'c', name: 'Eve', color: '#3B82F6' },
];

describe('playersForRound', () => {
  const uidsForRound = (roundIndex: number) => playersForRound(players, roundIndex).map((player) => player.uid);

  it('is the arrival order for the first round', () => {
    expect(uidsForRound(0)).toEqual(['a', 'b', 'c']);
  });

  it('moves the opening on by one player at every round, in the same order', () => {
    expect(uidsForRound(1)).toEqual(['b', 'c', 'a']);
    expect(uidsForRound(2)).toEqual(['c', 'a', 'b']);
  });

  it('comes back round to the first player after a full turn of the table', () => {
    expect(uidsForRound(3)).toEqual(['a', 'b', 'c']);
    expect(uidsForRound(7)).toEqual(['b', 'c', 'a']);
  });

  it('is an empty order with nobody in the room', () => {
    expect(playersForRound([], 2)).toEqual([]);
  });
});

describe('nextPlayerUid', () => {

  it('is the player who arrived right after', () => {
    expect(nextPlayerUid(players, 'a')).toBe('b');
    expect(nextPlayerUid(players, 'b')).toBe('c');
  });

  it('wraps around to the first player after the last one', () => {
    expect(nextPlayerUid(players, 'c')).toBe('a');
  });

  it('hands over to the first player when the uid is not listed, or not known yet', () => {
    expect(nextPlayerUid(players, 'ghost')).toBe('a');
    expect(nextPlayerUid(players, null)).toBe('a');
  });

  it('is undefined with nobody in the room', () => {
    expect(nextPlayerUid([], 'a')).toBeUndefined();
  });
});
