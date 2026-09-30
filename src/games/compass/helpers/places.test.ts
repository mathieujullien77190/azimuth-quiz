import { effectiveDifficulty } from './places';

describe('effectiveDifficulty', () => {
  it('leaves every place untouched in French', () => {
    expect(effectiveDifficulty({ code: 'FR', difficulty: 'easy' }, 'fr')).toBe('easy');
  });

  it('leaves non-French places untouched even in English', () => {
    expect(effectiveDifficulty({ code: 'DE', difficulty: 'easy' }, 'en')).toBe('easy');
  });

  it('bumps a French place up one tier in English', () => {
    expect(effectiveDifficulty({ code: 'FR', difficulty: 'easy' }, 'en')).toBe('intermediate');
    expect(effectiveDifficulty({ code: 'FR', difficulty: 'intermediate' }, 'en')).toBe('hard');
  });

  it('caps at "hard" instead of overflowing', () => {
    expect(effectiveDifficulty({ code: 'FR', difficulty: 'hard' }, 'en')).toBe('hard');
  });
});
