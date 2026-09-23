import { DEFAULT_SETTINGS } from '@/constants';
import type { GameSettings } from '@/types';

import { resizeNames, selectDifficultyFilter, toggleCategoryFilter, toggleSelected } from './helpers';

type Filter = Pick<GameSettings, 'categories' | 'difficulties'>;

describe('resizeNames', () => {
  it('keeps existing names and pads with empty strings when growing', () => {
    expect(resizeNames(['Alice', 'Bob'], 4)).toEqual(['Alice', 'Bob', '', '']);
  });

  it('truncates when shrinking', () => {
    expect(resizeNames(['Alice', 'Bob', 'Cid'], 1)).toEqual(['Alice']);
  });
});

describe('toggleSelected', () => {
  it('adds a value not yet selected', () => {
    expect(toggleSelected(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a selected value when more than one remains', () => {
    expect(toggleSelected(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('refuses to empty the selection entirely', () => {
    expect(toggleSelected(['a'], 'a')).toEqual(['a']);
  });
});

describe('toggleCategoryFilter', () => {
  it('toggles a regular category without touching difficulties', () => {
    const settings: Filter = { categories: ['cities'], difficulties: ['intermediate' as const] };
    expect(toggleCategoryFilter(settings, 'mountains')).toEqual({
      categories: ['cities', 'mountains'],
      difficulties: ['intermediate'],
    });
  });

  it('forces difficulty to easy when kids is selected', () => {
    const settings: Filter = { categories: ['cities'], difficulties: ['hard' as const] };
    expect(toggleCategoryFilter(settings, 'kids')).toEqual({
      categories: ['cities', 'kids'],
      difficulties: ['easy'],
    });
  });

  it('does not force difficulty when kids is deselected', () => {
    const settings: Filter = { categories: ['kids'], difficulties: ['easy' as const] };
    expect(toggleCategoryFilter(settings, 'kids')).toEqual({
      categories: [],
      difficulties: ['easy'],
    });
  });
});

describe('selectDifficultyFilter', () => {
  it('selecting easy keeps the current categories', () => {
    const settings: Filter = { categories: ['cities', 'kids'], difficulties: ['hard' as const] };
    expect(selectDifficultyFilter(settings, 'easy')).toEqual({
      categories: ['cities', 'kids'],
      difficulties: ['easy'],
    });
  });

  it('selecting a non-easy difficulty drops the kids category', () => {
    const settings: Filter = { categories: ['cities', 'kids'], difficulties: ['easy' as const] };
    expect(selectDifficultyFilter(settings, 'hard')).toEqual({
      categories: ['cities'],
      difficulties: ['hard'],
    });
  });

  it('falls back to the default categories when kids was the only one selected', () => {
    const settings: Filter = { categories: ['kids'], difficulties: ['easy' as const] };
    expect(selectDifficultyFilter(settings, 'hard')).toEqual({
      categories: DEFAULT_SETTINGS.categories,
      difficulties: ['hard'],
    });
  });
});
