import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CluesDoc, PlaceDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { places: {} as Record<string, unknown>, riddles: {} as Record<string, string | null> },
  applyRiddleChange: undefined as unknown as (syllable: string, riddle: string | null) => Promise<void>,
  applySyllableRemoval: undefined as unknown as (syllable: string) => Promise<void>,
  putPlace: undefined as unknown as (key: string, value: unknown) => Promise<void>,
  putRiddle: undefined as unknown as (syllable: string, riddle: string | null) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  applyRiddleChange: (syllable: string, riddle: string | null) => h.applyRiddleChange(syllable, riddle),
  applySyllableRemoval: (syllable: string) => h.applySyllableRemoval(syllable),
  putPlace: (key: string, value: unknown) => h.putPlace(key, value),
  putRiddle: (syllable: string, riddle: string | null) => h.putRiddle(syllable, riddle),
}));

import {
  charadeFor,
  deleteCharadeSyllable,
  normalizeSyllable,
  riddleFor,
  saveCharadeRiddle,
  saveCharadeSyllables,
} from './charades';

const cluesDoc = (overrides: Partial<CluesDoc> = {}): CluesDoc => ({
  positionInCountry: 'center',
  population: 1,
  climateEmoji: 'x',
  elevationMeters: 1,
  timezone: 'Europe/Paris',
  airportCode: 'CDG',
  emojis: [],
  syllables: ['pa', 'ris'],
  ...overrides,
});

const place = (overrides: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Paris',
  code: 'FR',
  latitude: 0,
  longitude: 0,
  difficulty: 'easy',
  clues: cluesDoc(),
  ...overrides,
});

beforeEach(() => {
  h.state.places = {};
  h.state.riddles = {};
  h.applyRiddleChange = vi.fn(async () => {});
  h.applySyllableRemoval = vi.fn(async () => {});
  h.putPlace = vi.fn(async () => {});
  h.putRiddle = vi.fn(async () => {});
});

describe('re-exports', () => {
  it('exposes the game charade helpers', () => {
    expect(normalizeSyllable('PÀ')).toBe('pa');
    expect(charadeFor({ syllables: ['pa'], riddles: ['R'] })).toEqual({ syllables: ['pa'], riddles: ['R'] });
  });
});

describe('riddleFor', () => {
  it('reads the riddle under the normalized syllable, null when there is none', () => {
    h.state.riddles = { pa: 'R' };

    expect(riddleFor('Pâ')).toBe('R');
    expect(riddleFor('ris')).toBeNull();
  });
});

describe('saveCharadeRiddle', () => {
  it('trims the text and writes it', async () => {
    expect(await saveCharadeRiddle('pa', '  Mon premier ')).toBe('Mon premier');
    expect(h.applyRiddleChange).toHaveBeenCalledWith('pa', 'Mon premier');
  });

  it('writes null for an empty text', async () => {
    expect(await saveCharadeRiddle('pa', '   ')).toBeNull();
    expect(h.applyRiddleChange).toHaveBeenCalledWith('pa', null);
  });
});

describe('deleteCharadeSyllable', () => {
  it('removes the syllable everywhere', async () => {
    await deleteCharadeSyllable('pa');

    expect(h.applySyllableRemoval).toHaveBeenCalledWith('pa');
  });
});

describe('saveCharadeSyllables', () => {
  it('stores the lowercased split with its riddles and creates the missing dictionary entries once', async () => {
    h.state.places = { par: place() };
    h.state.riddles = { pa: 'R' };

    const saved = await saveCharadeSyllables({ key: 'par', code: 'FR', name: 'Paris' }, ['Pa', 'PÂ', 'Rix']);

    expect(saved).toEqual(['pa', 'pâ', 'rix']);
    expect(h.putPlace).toHaveBeenCalledWith(
      'par',
      place({ clues: cluesDoc({ syllables: ['pa', 'pâ', 'rix'], riddles: ['R', 'R', null] }) }),
    );
    expect(h.putRiddle).toHaveBeenCalledTimes(1);
    expect(h.putRiddle).toHaveBeenCalledWith('rix', null);
  });
});
