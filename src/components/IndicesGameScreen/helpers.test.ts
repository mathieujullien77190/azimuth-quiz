import { INDICES_CLUE_ORDER, INDICES_PLACES, isCapitalPlace, isFrenchCityPlace } from '@/constants';
import type { Difficulty, IndicesClueId } from '@/types';

import { maxScoreForRound, normalizePlaceGuess, randomIndicesPlace, totalRevealCount } from './helpers';

describe('totalRevealCount', () => {
  const TWO_STAGE: IndicesClueId[] = ['distance', 'elevation', 'population', 'currency', 'localTime', 'letter'];

  it('matches revealing every clue, including every multi-stage one', () => {
    const allIds: IndicesClueId[] = INDICES_CLUE_ORDER.flatMap((clueId) => {
      const revealCount = clueId === 'emoji' || clueId === 'flagColors' ? 3 : TWO_STAGE.includes(clueId) ? 2 : 1;
      return Array<IndicesClueId>(revealCount).fill(clueId);
    });
    expect(totalRevealCount()).toBe(allIds.length);
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

  it('only draws French cities when "citiesFr" is the only category selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomIndicesPlace('easy', ['citiesFr'], 'fr');
      expect(isFrenchCityPlace(place)).toBe(true);
    }
  });

  it('never draws a French city when "citiesFr" is not selected', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomIndicesPlace('easy', ['cities', 'capital'], 'fr');
      expect(isFrenchCityPlace(place)).toBe(false);
    }
  });

  it('in English, never draws an "easy" French place (a French easy place is bumped to intermediate)', () => {
    for (let i = 0; i < 20; i += 1) {
      const place = randomIndicesPlace('easy', ['cities', 'capital'], 'en');
      if (place.code === 'FR') expect(place.difficulty).not.toBe('easy');
    }
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
