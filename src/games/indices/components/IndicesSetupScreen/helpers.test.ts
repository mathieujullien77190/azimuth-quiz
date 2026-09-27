import { resizeNames } from './helpers';

describe('resizeNames', () => {
  it('pads with empty strings when growing', () => {
    expect(resizeNames(['Zoé'], 3)).toEqual(['Zoé', '', '']);
  });

  it('truncates when shrinking, keeping existing names', () => {
    expect(resizeNames(['Zoé', 'Max', 'Léo'], 2)).toEqual(['Zoé', 'Max']);
  });

  it('returns the same length unchanged', () => {
    expect(resizeNames(['Zoé', 'Max'], 2)).toEqual(['Zoé', 'Max']);
  });

  it('handles resizing to 0', () => {
    expect(resizeNames(['Zoé'], 0)).toEqual([]);
  });
});
