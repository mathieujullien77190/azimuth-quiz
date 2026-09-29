import { personalityFor, personalityKey } from './personality';

describe('personalityKey', () => {
  it('is the code and name, pipe-separated, same shape as charadeKey/data/clues.ts own keys', () => {
    expect(personalityKey({ code: 'FR', name: 'Paris' })).toBe('FR|Paris');
  });
});

describe('personalityFor', () => {
  it('is null for a place with no curated entry, rather than a made-up one', () => {
    expect(personalityFor({ code: 'ZZ', name: 'Nowhereville' })).toBeNull();
  });

  it('returns the shipped, curated entry when there is one', () => {
    expect(personalityFor({ code: 'FR', name: 'Paris' })).toEqual({ name: 'Édith Piaf', description: 'chanteuse' });
  });
});
