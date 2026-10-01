import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cluePlaces: vi.fn(),
  charadeFor: vi.fn(),
  riddleFor: vi.fn(),
}));

vi.mock('../../api/places', () => ({ cluePlaces: mocks.cluePlaces }));
vi.mock('../../api/charades', () => ({
  charadeFor: mocks.charadeFor,
  riddleFor: mocks.riddleFor,
  normalizeSyllable: (s: string) => s.toLowerCase().replace(/[àâ]/g, 'a'),
}));

import { allSyllableRows, filterSyllableRows, VISIBLE_EXAMPLES } from './helpers';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('allSyllableRows', () => {
  it('groups syllables by normalized key, lists each place once, and sorts alphabetically', () => {
    const syllables: Record<string, string[]> = { Paris: ['Pa', 'ris'], Pâle: ['pâ', 'le'], Papa: ['pa', 'pa'] };
    mocks.cluePlaces.mockReturnValue(Object.keys(syllables).map((name) => ({ name })));
    mocks.charadeFor.mockImplementation((place: { name: string }) => ({ syllables: syllables[place.name] }));
    mocks.riddleFor.mockImplementation((s: string) => (s === 'ris' ? 'on en rit' : null));

    expect(allSyllableRows()).toEqual([
      { syllable: 'le', riddle: null, examples: ['Pâle'] },
      { syllable: 'pa', riddle: null, examples: ['Paris', 'Pâle', 'Papa'] },
      { syllable: 'ris', riddle: 'on en rit', examples: ['Paris'] },
    ]);
  });

  it('is empty without any place', () => {
    mocks.cluePlaces.mockReturnValue([]);
    expect(allSyllableRows()).toEqual([]);
  });
});

describe('filterSyllableRows', () => {
  const rows = [
    { syllable: 'pa', riddle: 'Un Père', examples: ['Paris'] },
    { syllable: 'ro', riddle: null, examples: ['Rome'] },
  ];

  it('returns every row for a blank query', () => {
    expect(filterSyllableRows(rows, '   ')).toBe(rows);
  });

  it('matches the syllable, the riddle or an example place', () => {
    expect(filterSyllableRows(rows, 'pa')).toEqual([rows[0]]);
    expect(filterSyllableRows(rows, 'PÈRE')).toEqual([rows[0]]);
    expect(filterSyllableRows(rows, 'rome')).toEqual([rows[1]]);
    expect(filterSyllableRows(rows, 'nothing')).toEqual([]);
  });
});

describe('VISIBLE_EXAMPLES', () => {
  it('is a positive count', () => {
    expect(VISIBLE_EXAMPLES).toBeGreaterThan(0);
  });
});
