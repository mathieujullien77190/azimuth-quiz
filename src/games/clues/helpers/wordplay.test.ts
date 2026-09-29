jest.mock('@/data/wordplay.json', () => ({
  'FR|Paris': { sentence: 'Ce lac est +Constance+.', explained: 'Ce lac est +Constance+.' },
  'FR|Vide': { sentence: '', explained: '' },
}));

// eslint-disable-next-line import/first
import { highlightSegments, wordplayFor, wordplayKey } from './wordplay';

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
      explained: 'Ce lac est +Constance+.',
    });
  });
});

describe('highlightSegments', () => {
  it('is one plain segment for text with no markup at all', () => {
    expect(highlightSegments('rien à voir ici')).toEqual([{ text: 'rien à voir ici', highlighted: false }]);
  });

  it('picks out a +highlighted+ word in the middle of the sentence', () => {
    expect(highlightSegments('Ce lac est +Constance+ dans son affection.')).toEqual([
      { text: 'Ce lac est ', highlighted: false },
      { text: 'Constance', highlighted: true },
      { text: ' dans son affection.', highlighted: false },
    ]);
  });

  it('supports several separate highlighted runs', () => {
    expect(highlightSegments('+Un+ jeu de +mots+.')).toEqual([
      { text: 'Un', highlighted: true },
      { text: ' jeu de ', highlighted: false },
      { text: 'mots', highlighted: true },
      { text: '.', highlighted: false },
    ]);
  });

  it('drops empty segments (markers with nothing between, or at the very start/end)', () => {
    expect(highlightSegments('++')).toEqual([]);
    expect(highlightSegments('+Tout+')).toEqual([{ text: 'Tout', highlighted: true }]);
  });

  it('is empty for an empty string', () => {
    expect(highlightSegments('')).toEqual([]);
  });

  it('highlights everything past an unclosed trailing +, rather than losing it', () => {
    expect(highlightSegments('normal puis +oups')).toEqual([
      { text: 'normal puis ', highlighted: false },
      { text: 'oups', highlighted: true },
    ]);
  });
});
