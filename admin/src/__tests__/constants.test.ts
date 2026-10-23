import { describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/data/game';

import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
} from '../constants';

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
});
