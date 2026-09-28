import type { RoomPlayers } from './roomBase';
import { freePlaceholder, isNameTaken, isNameTakenError, nameTakenError } from './roomName';

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
