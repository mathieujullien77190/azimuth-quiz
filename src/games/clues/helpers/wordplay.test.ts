jest.mock('@/data/wordplay.json', () => ({
  'FR|Paris': { sentence: 'Ce lac est +Constance+.', difficulty: 'hard' },
  'FR|Vide': { sentence: '', difficulty: 'easy' },
}));

// eslint-disable-next-line import/first
import { wordplayFor, wordplayKey } from './wordplay';

describe('wordplayKey', () => {
  it('is the code and name, pipe-separated, same shape as charadeKey', () => {
    expect(wordplayKey({ code: 'FR', name: 'Paris' })).toBe('FR|Paris');
  });
});

describe('wordplayFor', () => {
  it('is null for a place with no curated entry, rather than a made-up one', () => {
    expect(wordplayFor({ code: 'ZZ', name: 'Nowhereville' })).toBeNull();
  });

  it('is null for a place curated with an empty sentence, same as not curated at all', () => {
    expect(wordplayFor({ code: 'FR', name: 'Vide' })).toBeNull();
  });

  it('returns the shipped, curated entry when there is one', () => {
    expect(wordplayFor({ code: 'FR', name: 'Paris' })).toEqual({
      sentence: 'Ce lac est +Constance+.',
      difficulty: 'hard',
    });
  });
});
