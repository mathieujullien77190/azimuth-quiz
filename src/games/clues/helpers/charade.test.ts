jest.mock('@/data/charade.json', () => ({
  pa: 'un petit mot d’affection',
  bor: 'le rebord d’une table',
  be: 'le verbe être, à l’infinitif tronqué',
}));

// eslint-disable-next-line import/first
import {
  CHARADE_MAX_STAGES,
  CHARADE_SYLLABLE_STAGE_CAP,
  charadeFor,
  charadeLines,
  charadeMaxStage,
  charadeSyllableGroups,
  riddleFor,
  type CharadeEntry,
} from './charade';

describe('charadeFor', () => {
  it('falls back to the live heuristic split, lowercased, for a place with no override', () => {
    const entry = charadeFor({ name: 'Bordeaux' });
    expect(entry.syllables).toEqual(['bor', 'deaux']);
  });

  it('is deterministic (same input, same output)', () => {
    expect(charadeFor({ name: 'Nantes' })).toEqual(charadeFor({ name: 'Nantes' }));
  });

  it('uses the hand-curated override when there is one, lowercased regardless of how it was typed', () => {
    expect(charadeFor({ name: 'Bălți', syllables: ['BA', 'L'] })).toEqual({ syllables: ['ba', 'l'] });
  });

  it('can be curated down to no syllables at all — some names just don’t make a usable charade', () => {
    expect(charadeFor({ name: 'Bălți', syllables: [] })).toEqual({ syllables: [] });
  });
});

describe('riddleFor', () => {
  it('is null for a syllable with nothing curated', () => {
    expect(riddleFor('xyz')).toBeNull();
  });

  it('returns the curated riddle, case-insensitively ("Pa" and "pa" share it)', () => {
    expect(riddleFor('pa')).toBe('un petit mot d’affection');
    expect(riddleFor('Pa')).toBe('un petit mot d’affection');
    expect(riddleFor('PA')).toBe('un petit mot d’affection');
  });

  it('applies to every place with that syllable, not just the one it was first curated for', () => {
    // "Bor" is Bordeaux's first syllable, but the same riddle also covers any other "bor".
    expect(riddleFor('Bor')).toBe('le rebord d’une table');
  });

  it('folds "à"/"â" onto "a" — true homophones in French, so "pa" also covers "pà"/"pâ"', () => {
    expect(riddleFor('pà')).toBe('un petit mot d’affection');
    expect(riddleFor('pâ')).toBe('un petit mot d’affection');
  });

  it('never folds the "e" family onto "be" — "e"/"é"/"è" are genuinely different sounds', () => {
    expect(riddleFor('be')).toBe('le verbe être, à l’infinitif tronqué');
    expect(riddleFor('bé')).toBeNull();
    expect(riddleFor('bè')).toBeNull();
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
    expect(charadeMaxStage({ syllables: ['Pa', 'ris'] })).toBe(3);
  });

  it('never exceeds CHARADE_MAX_STAGES, however many syllables the name actually has', () => {
    const entry: CharadeEntry = { syllables: Array(9).fill('la') };
    expect(charadeMaxStage(entry)).toBe(CHARADE_MAX_STAGES);
  });
});

describe('charadeLines', () => {
  const entry: CharadeEntry = { syllables: ['Bor', 'deaux'] };

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
    const long: CharadeEntry = { syllables: ['An', 'ta', 'na', 'na', 'ri', 'vo'] };
    const { lines } = charadeLines(long, 4);
    expect(lines).toHaveLength(4);
    expect(lines[3]).toEqual({ label: 'mes dernières syllabes', text: 'na, ri, vo' });
  });
});
