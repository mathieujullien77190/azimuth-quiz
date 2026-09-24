import { nameSkeleton } from './indicesSkeleton';

describe('nameSkeleton', () => {
  it('single word, length known: first letter revealed, one hidden slot per remaining letter', () => {
    expect(nameSkeleton('Berlin', { lengthKnown: true })).toEqual([['B', null, null, null, null, null]]);
  });

  it('single word, length not known: only the first letter, in its own single-slot group', () => {
    expect(nameSkeleton('Berlin', { lengthKnown: false })).toEqual([['B']]);
  });

  it('several words, length known: real per-word letter count, first letter of the first word revealed', () => {
    expect(nameSkeleton('Rio de Janeiro', { lengthKnown: true })).toEqual([
      ['R', null, null],
      [null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('several words, length not known: one generic slot per word, not the real per-word length', () => {
    expect(nameSkeleton('Rio de Janeiro', { lengthKnown: false })).toEqual([['R'], [null], [null]]);
  });

  it('ignores spaces/hyphens/apostrophes, keeps accented letters', () => {
    expect(nameSkeleton("Côte d'Ivoire", { lengthKnown: true })).toEqual([
      ['C', null, null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('falls back to no first letter when the name has no letters at all', () => {
    expect(nameSkeleton('42', { lengthKnown: false })).toEqual([[null]]);
  });

  it('revealVowels fills in every vowel of the name on top of the first letter, once length is known', () => {
    expect(nameSkeleton('Berlin', { lengthKnown: true, revealVowels: true })).toEqual([['B', 'E', null, null, 'I', null]]);
  });

  it('revealVowels has no effect before the length is known (no slots to fill beyond the first letter)', () => {
    expect(nameSkeleton('Berlin', { lengthKnown: false, revealVowels: true })).toEqual([['B']]);
  });
});
