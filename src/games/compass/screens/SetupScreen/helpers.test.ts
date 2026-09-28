import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import type { GameSettings } from '@/types';

import { selectDifficultyFilter, toggleCategoryFilter, toggleSelected } from './helpers';

type Filter = Pick<GameSettings, 'categories' | 'difficulty'>;

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
  it('toggles a regular category without touching the difficulty', () => {
    const settings: Filter = { categories: ['cities'], difficulty: 'intermediate' as const };
    expect(toggleCategoryFilter(settings, 'mountains')).toEqual({
      categories: ['cities', 'mountains'],
      difficulty: 'intermediate',
    });
  });

  it('forces difficulty to easy when kids is selected', () => {
    const settings: Filter = { categories: ['cities'], difficulty: 'hard' as const };
    expect(toggleCategoryFilter(settings, 'kids')).toEqual({
      categories: ['cities', 'kids'],
      difficulty: 'easy',
    });
  });

  it('does not force difficulty when kids is deselected', () => {
    const settings: Filter = { categories: ['kids'], difficulty: 'easy' as const };
    expect(toggleCategoryFilter(settings, 'kids')).toEqual({
      categories: [],
      difficulty: 'easy',
    });
  });
});

describe('selectDifficultyFilter', () => {
  it('selecting easy keeps the current categories', () => {
    const settings: Filter = { categories: ['cities', 'kids'], difficulty: 'hard' as const };
    expect(selectDifficultyFilter(settings, 'easy')).toEqual({
      categories: ['cities', 'kids'],
      difficulty: 'easy',
    });
  });

  it('selecting a non-easy difficulty drops the kids category', () => {
    const settings: Filter = { categories: ['cities', 'kids'], difficulty: 'easy' as const };
    expect(selectDifficultyFilter(settings, 'hard')).toEqual({
      categories: ['cities'],
      difficulty: 'hard',
    });
  });

  it('falls back to the default categories when kids was the only one selected', () => {
    const settings: Filter = { categories: ['kids'], difficulty: 'easy' as const };
    expect(selectDifficultyFilter(settings, 'hard')).toEqual({
      categories: DEFAULT_SETTINGS.categories,
      difficulty: 'hard',
    });
  });
});
