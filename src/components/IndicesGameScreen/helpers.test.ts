import { INDICES_CLUE_ORDER, INDICES_PLACES, isCapitalPlace } from '@/constants';
import type { Difficulty, IndicesClueId } from '@/types';

import { maxScoreForRound, nameSkeleton, normalizePlaceGuess, randomIndicesPlace, totalRevealCount } from './helpers';

describe('totalRevealCount', () => {
  const TWO_STAGE: IndicesClueId[] = ['distance', 'elevation', 'population', 'currency', 'localTime'];

  it('matches revealing every clue, including every multi-stage one', () => {
    const flagColorCount = 3;
    const allIds: IndicesClueId[] = INDICES_CLUE_ORDER.flatMap((clueId) => {
      const revealCount =
        clueId === 'emoji' ? 3 : clueId === 'flagColors' ? flagColorCount + 1 : TWO_STAGE.includes(clueId) ? 2 : 1;
      return Array<IndicesClueId>(revealCount).fill(clueId);
    });
    expect(totalRevealCount(flagColorCount)).toBe(allIds.length);
  });

  it('grows with the number of flag colors, up to 3 (plus the flag reveal click)', () => {
    expect(totalRevealCount(3)).toBe(totalRevealCount(2) + 1);
  });

  it('caps the color-click count at 3 regardless of how many colors the flag actually has (the flag reveal click still adds 1)', () => {
    expect(totalRevealCount(5)).toBe(totalRevealCount(3));
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
  const difficulties: Difficulty[] = ['easy', 'intermediate', 'hard'];

  it.each(difficulties)('only returns places matching difficulty %s', (difficulty) => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomIndicesPlace(difficulty, ['cities', 'capital'], 'fr').difficulty).toBe(difficulty);
    }
  });

  it('falls back to the full pool when the filtered pool is empty', () => {
    const place = randomIndicesPlace('does-not-exist' as Difficulty, ['cities', 'capital'], 'fr');
    expect(INDICES_PLACES).toContainEqual(place);
  });

  it('only draws capitals when "cities" is not selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomIndicesPlace('easy', ['capital'], 'fr');
      expect(isCapitalPlace(place)).toBe(true);
    }
  });

  it('only draws non-capital cities when "capital" is not selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomIndicesPlace('easy', ['cities'], 'fr');
      expect(isCapitalPlace(place)).toBe(false);
    }
  });

  it('in English, never draws an "easy" French place (a French easy place is bumped to intermediate)', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomIndicesPlace('easy', ['cities', 'capital'], 'en');
      if (place.code === 'FR') expect(place.difficulty).not.toBe('easy');
    }
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

  it('falls back to no first letter when the name has no letters at all', () => {
    expect(nameSkeleton('42', { groupByWord: true, revealFirst: true, lengthKnown: false })).toEqual([[null]]);
  });

  it('word count known but not length: one generic slot per word, not the real per-word length', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: false, lengthKnown: false })).toEqual([
      [null],
      [null],
      [null],
    ]);
  });

  it('word count known but not length, with first letter revealed', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, revealFirst: true, lengthKnown: false })).toEqual([
      ['R'],
      [null],
      [null],
    ]);
  });
});

describe('normalizePlaceGuess', () => {
  it('lowercases the value', () => {
    expect(normalizePlaceGuess('PARIS')).toBe('paris');
  });

  it('strips accents', () => {
    expect(normalizePlaceGuess('São Paulo')).toBe('saopaulo');
  });

  it('drops spaces and punctuation entirely, not just collapses them', () => {
    expect(normalizePlaceGuess("  Côte d'Ivoire! ")).toBe('cotedivoire');
  });

  it('treats equivalent spellings as equal', () => {
    expect(normalizePlaceGuess('Rio de Janeiro')).toBe(normalizePlaceGuess('  rio   DE Janeiro  '));
  });

  it('treats any accented letter as its unaccented base letter (é=e, ń=n...), not just the common ones', () => {
    expect(normalizePlaceGuess('Gdańsk')).toBe('gdansk');
    expect(normalizePlaceGuess('École')).toBe(normalizePlaceGuess('Ecole'));
  });

  it("treats an apostrophe, a space, and no separator at all as equal", () => {
    const withApostrophe = normalizePlaceGuess("N'Djamena");
    expect(normalizePlaceGuess('N Djamena')).toBe(withApostrophe);
    expect(normalizePlaceGuess('Ndjamena')).toBe(withApostrophe);
  });
});
