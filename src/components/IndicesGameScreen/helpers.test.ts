import { INDICES_CLUE_COSTS, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesClueId } from '@/types';

import { normalizePlaceGuess, randomIndicesPlace, scoreForRevealed } from './helpers';

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
