import type { RoomPlayers } from '../../firebase/room';
import { freePlaceholder, isNameTaken, isNameTakenError, nameTakenError, onlinePlayersFrom } from '../roomPlayers';

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

const player = (name: string) => ({ name, joinedAt: null });
const PLAYERS: RoomPlayers = { host: player('Zoé'), max: player('Max') };

describe('isNameTaken', () => {
  it('is true when another player has the name', () => {
    expect(isNameTaken('Zoé', PLAYERS, 'joiner')).toBe(true);
  });

  it('ignores case and the spaces around the name', () => {
    expect(isNameTaken('  zoÉ ', PLAYERS, 'joiner')).toBe(true);
    expect(isNameTaken('MAX', PLAYERS, 'joiner')).toBe(true);
  });

  it('is false for a free name', () => {
    expect(isNameTaken('Léa', PLAYERS, 'joiner')).toBe(false);
    expect(isNameTaken('Zoé2', PLAYERS, 'joiner')).toBe(false);
  });

  it("never counts the player's own entry", () => {
    expect(isNameTaken('Zoé', PLAYERS, 'host')).toBe(false);
  });

  it('is false in an empty room', () => {
    expect(isNameTaken('Zoé', {}, 'joiner')).toBe(false);
  });
});

describe('nameTakenError', () => {
  it('is recognised as such, and only such', () => {
    expect(isNameTakenError(nameTakenError())).toBe(true);
    expect(isNameTakenError(new Error('offline'))).toBe(false);
    expect(isNameTakenError(Object.assign(new Error('x'), { code: 'permission-denied' }))).toBe(false);
    expect(isNameTakenError('name-taken')).toBe(false);
    expect(isNameTakenError(undefined)).toBe(false);
  });
});

describe('freePlaceholder', () => {
  const NAMES = ['Zoé', 'Max', 'Léo'] as const;

  it('is the first name when nobody has it', () => {
    expect(freePlaceholder(NAMES, {}, null)).toBe('Zoé');
  });

  it('skips the names other players already have', () => {
    expect(freePlaceholder(NAMES, { host: player('Zoé') }, null)).toBe('Max');
    expect(freePlaceholder(NAMES, { host: player('Zoé'), max: player('Max') }, 'joiner')).toBe('Léo');
    expect(freePlaceholder(NAMES, { host: player('zoé ') }, null)).toBe('Max');
  });

  it("keeps the name a player already has: its own entry doesn't count", () => {
    expect(freePlaceholder(NAMES, { host: player('Zoé'), max: player('Max') }, 'max')).toBe('Max');
  });

  it('falls back to the first name when all are taken', () => {
    const all: RoomPlayers = { a: player('Zoé'), b: player('Max'), c: player('Léo') };
    expect(freePlaceholder(NAMES, all, null)).toBe('Zoé');
  });
});
