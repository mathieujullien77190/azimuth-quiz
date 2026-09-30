import { wordplayFor } from './wordplay';

describe('wordplayFor', () => {
  it('is null for a place with no curated entry, rather than a made-up one', () => {
    expect(wordplayFor({})).toBeNull();
  });

  it('is null for a place curated with an empty (or blank) sentence, same as not curated at all', () => {
    expect(wordplayFor({ wordplay: { sentence: '', difficulty: 'easy' } })).toBeNull();
    expect(wordplayFor({ wordplay: { sentence: '   ', difficulty: 'easy' } })).toBeNull();
  });

  it('returns the entry the place carries when there is one', () => {
    const wordplay = { sentence: 'Ce lac est +Constance+.', difficulty: 'hard' } as const;
    expect(wordplayFor({ wordplay })).toEqual(wordplay);
  });
});
