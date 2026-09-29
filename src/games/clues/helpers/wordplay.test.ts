jest.mock('@/data/wordplay.json', () => ({
  par: { sentence: 'Ce lac est +Constance+.', difficulty: 'hard' },
  vid: { sentence: '', difficulty: 'easy' },
}));

// eslint-disable-next-line import/first
import { wordplayFor } from './wordplay';

describe('wordplayFor', () => {
  it('is null for a place with no curated entry, rather than a made-up one', () => {
    expect(wordplayFor({ key: 'zzz' })).toBeNull();
  });

  it('is null for a place curated with an empty sentence, same as not curated at all', () => {
    expect(wordplayFor({ key: 'vid' })).toBeNull();
  });

  it('returns the shipped, curated entry when there is one', () => {
    expect(wordplayFor({ key: 'par' })).toEqual({
      sentence: 'Ce lac est +Constance+.',
      difficulty: 'hard',
    });
  });
});
