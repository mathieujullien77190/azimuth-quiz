import { describe, expect, it, vi } from 'vitest';

vi.mock('./data', () => ({ countryName: (code: string) => `name of ${code}` }));

import { CATEGORIES } from '@/games/compass/constants';

import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  POSITION_LABELS,
  countryFor,
} from './constants';

describe('category constants', () => {
  it('has a label and a colour for every category of the order', () => {
    for (const category of CATEGORY_ORDER) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
      expect(CATEGORY_COLORS[category]).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(CATEGORY_ORDER).toHaveLength(Object.keys(CATEGORY_LABELS).length);
  });

  it('takes the emojis from the game categories', () => {
    for (const { id, emoji } of CATEGORIES) expect(CATEGORY_EMOJIS[id]).toBe(emoji);
  });
});

describe('difficulty and position constants', () => {
  it('has a label and a colour for each difficulty, easiest first', () => {
    expect(DIFFICULTY_ORDER).toEqual(['easy', 'intermediate', 'hard']);
    for (const difficulty of DIFFICULTY_ORDER) {
      expect(DIFFICULTY_LABELS[difficulty]).toBeTruthy();
      expect(DIFFICULTY_COLORS[difficulty]).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('labels the nine positions in a country', () => {
    expect(Object.keys(POSITION_LABELS).sort()).toEqual(['center', 'e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w']);
  });
});

describe('countryFor', () => {
  it('asks the loaded data for the country name', () => {
    expect(countryFor('FR')).toBe('name of FR');
  });
});
