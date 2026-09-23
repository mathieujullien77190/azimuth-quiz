import { INDICES_CLUE_ORDER, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesClueId } from '@/types';

import { maxScoreForRound, nameSkeleton, normalizePlaceGuess, randomIndicesPlace, totalRevealCount } from './helpers';

describe('totalRevealCount', () => {
  it('matches revealing every clue, including every stage of emoji/flagColors/distance', () => {
    const flagColorCount = 3;
    const allIds: IndicesClueId[] = INDICES_CLUE_ORDER.flatMap((clueId) => {
      const revealCount =
        clueId === 'emoji' ? 3 : clueId === 'flagColors' ? flagColorCount : clueId === 'distance' ? 2 : 1;
      return Array<IndicesClueId>(revealCount).fill(clueId);
    });
    expect(totalRevealCount(flagColorCount)).toBe(allIds.length);
  });

  it('grows with the number of flag colors (country-dependent)', () => {
    expect(totalRevealCount(3)).toBe(totalRevealCount(2) + 1);
  });
});

describe('maxScoreForRound', () => {
  it('rounds up to the next multiple of ten', () => {
    expect(maxScoreForRound(26)).toBe(30);
    expect(maxScoreForRound(21)).toBe(30);
    expect(maxScoreForRound(20)).toBe(20);
    expect(maxScoreForRound(1)).toBe(10);
  });
});

describe('randomIndicesPlace', () => {
  const difficulties: Difficulty[] = ['easy', 'intermediate', 'hard', 'master'];

  it.each(difficulties)('only returns places matching difficulty %s', (difficulty) => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomIndicesPlace(difficulty).difficulty).toBe(difficulty);
    }
  });

  it('falls back to the full pool when the filtered pool is empty', () => {
    const place = randomIndicesPlace('does-not-exist' as Difficulty);
    expect(INDICES_PLACES).toContainEqual(place);
  });
});

describe('nameSkeleton', () => {
  it('one hidden slot per letter, single group when not grouped by word and length known', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: false, lengthKnown: true })).toEqual([
      [null, null, null, null, null, null],
    ]);
  });

  it('reveals only the very first letter of the whole name', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: true, lengthKnown: true })).toEqual([
      ['B', null, null, null, null, null],
    ]);
  });

  it('groups by the real per-word letter count when both word count and length are known', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: false, lengthKnown: true })).toEqual([
      [null, null, null],
      [null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('combines first-letter reveal with real word grouping', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: true, lengthKnown: true })).toEqual([
      ['R', null, null],
      [null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('ignores spaces/hyphens/apostrophes, keeps accented letters', () => {
    expect(nameSkeleton("Côte d'Ivoire", { groupByWord: false, revealFirst: false, lengthKnown: true })).toEqual([
      Array<null>(11).fill(null),
    ]);
  });

  it('without lengthKnown or groupByWord, keeps only the revealed first letter', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: true, lengthKnown: false })).toEqual([['B']]);
  });

  it('without lengthKnown or groupByWord and no revealed letter, returns no groups at all', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: false, lengthKnown: false })).toEqual([]);
  });

  it('word count known but not length: generic 4-slot groups, not the real per-word length', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: false, lengthKnown: false })).toEqual([
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
  });

  it('word count known but not length, with first letter revealed', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: true, lengthKnown: false })).toEqual([
      ['R', null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
  });
});

describe('normalizePlaceGuess', () => {
  it('lowercases the value', () => {
    expect(normalizePlaceGuess('PARIS')).toBe('paris');
  });

  it('strips accents', () => {
    expect(normalizePlaceGuess('São Paulo')).toBe('sao paulo');
  });

  it('replaces punctuation with spaces and trims', () => {
    expect(normalizePlaceGuess("  Côte d'Ivoire! ")).toBe('cote d ivoire');
  });

  it('treats equivalent spellings as equal', () => {
    expect(normalizePlaceGuess('Rio de Janeiro')).toBe(normalizePlaceGuess('  rio   DE Janeiro  '));
  });
});
