import { describe, expect, it, vi } from 'vitest';

vi.mock('../../constants', () => ({
  countryFor: (code: string) => ({ FR: 'France', IT: 'Italie' })[code] ?? code,
}));

import type { PlaceRow } from '../../api/places';
import { CLUE_FIELD_BY_KEY, filterRows, fmtCoord } from './helpers';

const row = (over: Partial<PlaceRow> & { category?: string; difficulty?: string; cluesDifficulty?: string }): PlaceRow =>
  ({
    key: 'k',
    name: 'Paris',
    code: 'FR',
    coordinates: { latitude: 0, longitude: 0 },
    compass: over.category ? { category: over.category, difficulty: over.difficulty ?? 'easy' } : null,
    clues: over.cluesDifficulty ? { difficulty: over.cluesDifficulty } : null,
    ...over,
  }) as unknown as PlaceRow;

const ALL_CATEGORIES = new Set(['cities', 'capital']);
const ALL_DIFFICULTIES = new Set(['easy', 'hard']);

describe('fmtCoord', () => {
  it('uses the positive letter for a positive value', () => {
    expect(fmtCoord(48.85661, 'N', 'S')).toBe('48.8566° N');
  });

  it('uses the negative letter and drops the sign for a negative value', () => {
    expect(fmtCoord(-2.5, 'E', 'O')).toBe('2.5000° O');
  });

  it('treats zero as positive', () => {
    expect(fmtCoord(0, 'N', 'S')).toBe('0.0000° N');
  });
});

describe('filterRows', () => {
  it('keeps everything when filters are fully open', () => {
    const rows = [row({ category: 'cities' }), row({ cluesDifficulty: 'hard' })];
    expect(filterRows(rows, '', ALL_CATEGORIES, ALL_DIFFICULTIES)).toHaveLength(2);
  });

  it('drops a Compass row whose category is not selected', () => {
    const rows = [row({ category: 'cities' }), row({ category: 'capital' })];
    expect(filterRows(rows, '', new Set(['capital']), ALL_DIFFICULTIES)).toEqual([rows[1]]);
  });

  it('filters on the Compass difficulty, then falls back to the Clues one', () => {
    const rows = [row({ category: 'cities', difficulty: 'hard' }), row({ cluesDifficulty: 'hard' }), row({ cluesDifficulty: 'easy' })];
    expect(filterRows(rows, '', ALL_CATEGORIES, new Set(['easy']))).toEqual([rows[2]]);
  });

  it('keeps a row that has neither Compass nor Clues data', () => {
    const rows = [row({})];
    expect(filterRows(rows, '', new Set(), new Set())).toEqual(rows);
  });

  it('searches by name, country name or code, ignoring case and spaces around', () => {
    const paris = row({ name: 'Paris', code: 'FR' });
    const rome = row({ name: 'Rome', code: 'IT' });
    const rows = [paris, rome];
    expect(filterRows(rows, '  PAR ', ALL_CATEGORIES, ALL_DIFFICULTIES)).toEqual([paris]);
    expect(filterRows(rows, 'it', ALL_CATEGORIES, ALL_DIFFICULTIES)).toContain(rome);
    expect(filterRows(rows, 'zzzz', ALL_CATEGORIES, ALL_DIFFICULTIES)).toEqual([]);
  });

  it('matches the country name through its code', () => {
    const rows = [row({ name: 'Rome', code: 'IT' })];
    expect(filterRows(rows, 'itali', ALL_CATEGORIES, ALL_DIFFICULTIES)).toEqual(rows);
  });
});

describe('CLUE_FIELD_BY_KEY', () => {
  it('maps clue patch keys to the field showing the save flag', () => {
    expect(CLUE_FIELD_BY_KEY).toEqual({ population: 'population', climateEmoji: 'climate', emojis: 'emojis' });
  });
});
