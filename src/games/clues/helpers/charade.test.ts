import {
  CHARADE_MAX_STAGES,
  CHARADE_SYLLABLE_STAGE_CAP,
  charadeFor,
  charadeLines,
  charadeMaxStage,
  charadeReady,
  charadeSyllableGroups,
  normalizeSyllable,
  type CharadeEntry,
} from './charade';

describe('charadeFor', () => {
  it('reads the syllables and their riddles straight off the place — no computation, no lookup', () => {
    expect(charadeFor({ syllables: ['bor', 'deaux'], riddles: ['a', null] })).toEqual({
      syllables: ['bor', 'deaux'],
      riddles: ['a', null],
    });
  });

  it('is empty for a place with no usable syllable', () => {
    expect(charadeFor({ syllables: [], riddles: [] })).toEqual({ syllables: [], riddles: [] });
  });
});

describe('charadeReady', () => {
  it('is true once every syllable has a riddle', () => {
    expect(charadeReady({ syllables: ['pa', 'bor'], riddles: ['x', 'y'] })).toBe(true);
  });

  it('is false as soon as one syllable has nothing curated', () => {
    expect(charadeReady({ syllables: ['pa', 'deaux'], riddles: ['x', null] })).toBe(false);
  });

  it('is false for a place with no syllable at all — vacuously-true `every` would otherwise offer an empty card', () => {
    expect(charadeReady({ syllables: [], riddles: [] })).toBe(false);
  });
});

describe('normalizeSyllable', () => {
  it('is case-insensitive ("Pa" and "pa" share the same riddle)', () => {
    expect(normalizeSyllable('Pa')).toBe('pa');
    expect(normalizeSyllable('PA')).toBe('pa');
  });

  it('folds "à"/"â" onto "a" — true homophones in French', () => {
    expect(normalizeSyllable('pà')).toBe('pa');
    expect(normalizeSyllable('pâ')).toBe('pa');
  });

  it('never folds the "e" family onto "be" — "e"/"é"/"è" are genuinely different sounds', () => {
    expect(normalizeSyllable('bé')).toBe('bé');
    expect(normalizeSyllable('bè')).toBe('bè');
  });
});

describe('charadeSyllableGroups', () => {
  it('is one syllable per group, up to the cap', () => {
    expect(charadeSyllableGroups(1)).toEqual([[0]]);
    expect(charadeSyllableGroups(2)).toEqual([[0], [1]]);
    expect(charadeSyllableGroups(CHARADE_SYLLABLE_STAGE_CAP)).toEqual([[0], [1], [2], [3]]);
  });

  it('bundles every syllable past the cap into one last group', () => {
    expect(charadeSyllableGroups(CHARADE_SYLLABLE_STAGE_CAP + 1)).toEqual([[0], [1], [2], [3, 4]]);
    expect(charadeSyllableGroups(6)).toEqual([[0], [1], [2], [3, 4, 5]]);
  });

  it('is empty for a name with no syllable at all', () => {
    expect(charadeSyllableGroups(0)).toEqual([]);
  });
});

describe('charadeMaxStage', () => {
  it('is the syllable count plus the final clear stage, below the cap', () => {
    expect(charadeMaxStage({ syllables: ['Pa', 'ris'], riddles: [null, null] })).toBe(3);
  });

  it('never exceeds CHARADE_MAX_STAGES, however many syllables the name actually has', () => {
    const entry: CharadeEntry = { syllables: Array(9).fill('la'), riddles: Array(9).fill(null) };
    expect(charadeMaxStage(entry)).toBe(CHARADE_MAX_STAGES);
  });
});

describe('charadeLines', () => {
  const entry: CharadeEntry = { syllables: ['Bor', 'deaux'], riddles: ['le rebord d’une table', null] };

  it('reveals nothing at stage 0', () => {
    expect(charadeLines(entry, 0)).toEqual({ lines: [] });
  });

  it('reveals one line per group, ordinal label first then "mon deuxième"...', () => {
    expect(charadeLines(entry, 1)).toEqual({ lines: [{ label: 'mon premier', text: 'le rebord d’une table' }] });
    expect(charadeLines(entry, 2).lines).toHaveLength(2);
    expect(charadeLines(entry, 2).lines[1].label).toBe('mon deuxième');
  });

  it('falls back to the plain syllable, read out loud, when a syllable has no curated riddle', () => {
    expect(charadeLines(entry, 2).lines[1].text).toBe('se dit « deaux »');
  });

  it('adds the name spelled out in clear once the stage goes past the last group', () => {
    const { lines, clear } = charadeLines(entry, 3);
    expect(lines).toHaveLength(2);
    expect(clear).toBe('Bor-Deaux');
  });

  it('never reveals more lines than there are groups, and clamps stage 0 or negative to nothing', () => {
    expect(charadeLines(entry, -1)).toEqual({ lines: [] });
    expect(charadeLines(entry, 100).lines).toHaveLength(2);
  });

  it('bundles the overflow syllables of a long name into one "mes dernières syllabes" line', () => {
    const long: CharadeEntry = { syllables: ['An', 'ta', 'na', 'na', 'ri', 'vo'], riddles: Array(6).fill(null) };
    const { lines } = charadeLines(long, 4);
    expect(lines).toHaveLength(4);
    expect(lines[3]).toEqual({ label: 'mes dernières syllabes', text: 'na, ri, vo' });
  });
});
