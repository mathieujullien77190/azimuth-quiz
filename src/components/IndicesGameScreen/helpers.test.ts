import { INDICES_CLUE_COSTS, INDICES_CLUE_ORDER, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesClueId } from '@/types';

import { maxRoundScore, nameSkeleton, normalizePlaceGuess, randomIndicesPlace, scoreForRevealed } from './helpers';

describe('scoreForRevealed', () => {
  it('returns 0 for no revealed clues', () => {
    expect(scoreForRevealed([])).toBe(0);
  });

  it('sums the cost of every revealed clue', () => {
    const ids: IndicesClueId[] = ['position', 'population', 'letterCount'];
    const expected = ids.reduce((total, id) => total + INDICES_CLUE_COSTS[id], 0);
    expect(scoreForRevealed(ids)).toBe(expected);
  });

  it('counts repeated ids (emoji/flagColors multi-reveal) once per occurrence', () => {
    const ids: IndicesClueId[] = ['emoji', 'emoji', 'emoji'];
    expect(scoreForRevealed(ids)).toBe(INDICES_CLUE_COSTS.emoji * 3);
  });
});

describe('maxRoundScore', () => {
  it('matches revealing every clue, including every stage of emoji/flagColors/distance', () => {
    const flagColorCount = 3;
    const allIds: IndicesClueId[] = INDICES_CLUE_ORDER.flatMap((clueId) => {
      const revealCount =
        clueId === 'emoji' ? 3 : clueId === 'flagColors' ? flagColorCount : clueId === 'distance' ? 2 : 1;
      return Array<IndicesClueId>(revealCount).fill(clueId);
    });
    expect(maxRoundScore(flagColorCount)).toBe(scoreForRevealed(allIds));
  });

  it('grows with the number of flag colors (country-dependent)', () => {
    expect(maxRoundScore(3)).toBe(maxRoundScore(2) + INDICES_CLUE_COSTS.flagColors);
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
  it('one hidden slot per letter, single group when not grouped by word', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: false, includeHidden: true })).toEqual([
      [null, null, null, null, null, null],
    ]);
  });

  it('reveals only the very first letter of the whole name', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: true, includeHidden: true })).toEqual([
      ['B', null, null, null, null, null],
    ]);
  });

  it('groups by word when groupByWord is set', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: false, includeHidden: true })).toEqual([
      [null, null, null],
      [null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('combines first-letter reveal with word grouping', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: true, includeHidden: true })).toEqual([
      ['R', null, null],
      [null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('ignores spaces/hyphens/apostrophes, keeps accented letters', () => {
    expect(nameSkeleton("Côte d'Ivoire", { groupByWord: false, revealFirst: false, includeHidden: true })).toEqual([
      Array<null>(11).fill(null),
    ]);
  });

  it('without includeHidden, keeps only the revealed first letter (length stays unknown)', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: true, includeHidden: false })).toEqual([['B']]);
  });

  it('without includeHidden and no revealed letter, returns no groups at all', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, revealFirst: false, includeHidden: false })).toEqual([]);
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: false, includeHidden: false })).toEqual([]);
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
