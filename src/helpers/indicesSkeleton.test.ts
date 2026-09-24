import { nameSkeleton } from './indicesSkeleton';

describe('nameSkeleton', () => {
  it('1st click (not grouped): a single group holding just the first letter', () => {
    expect(nameSkeleton('Berlin', { groupByWord: false, lengthKnown: false })).toEqual([['B']]);
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: false, lengthKnown: false })).toEqual([['R']]);
  });

  it('1st click, no letters at all in the name: no groups', () => {
    expect(nameSkeleton('42', { groupByWord: false, lengthKnown: false })).toEqual([]);
  });

  it('2nd click, single word: one generic slot, identical to the 1st click', () => {
    expect(nameSkeleton('Berlin', { groupByWord: true, lengthKnown: false })).toEqual([['B']]);
  });

  it('2nd click, several words: one generic slot per word, not the real per-word length', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, lengthKnown: false })).toEqual([['R'], [null], [null]]);
  });

  it('3rd click: real per-word letter count, first letter of the first word revealed', () => {
    expect(nameSkeleton('Rio de Janeiro', { groupByWord: true, lengthKnown: true })).toEqual([
      ['R', null, null],
      [null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('3rd click, single word', () => {
    expect(nameSkeleton('Berlin', { groupByWord: true, lengthKnown: true })).toEqual([['B', null, null, null, null, null]]);
  });

  it('ignores spaces/hyphens/apostrophes, keeps accented letters', () => {
    expect(nameSkeleton("Côte d'Ivoire", { groupByWord: true, lengthKnown: true })).toEqual([
      ['C', null, null, null],
      [null, null, null, null, null, null, null],
    ]);
  });

  it('revealVowels fills in every vowel of the name on top of the first letter, once length is known', () => {
    expect(nameSkeleton('Berlin', { groupByWord: true, lengthKnown: true, revealVowels: true })).toEqual([
      ['B', 'E', null, null, 'I', null],
    ]);
  });

  it('revealVowels has no effect before the length is known (no slots to fill beyond the first letter)', () => {
    expect(nameSkeleton('Berlin', { groupByWord: true, lengthKnown: false, revealVowels: true })).toEqual([['B']]);
  });
});
