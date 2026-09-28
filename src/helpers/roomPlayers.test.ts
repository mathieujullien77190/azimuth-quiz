import type { RoomPlayers } from './roomBase';
import { onlinePlayersFrom } from './roomPlayers';

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
