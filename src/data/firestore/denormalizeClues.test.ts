import { planJobChange, planRiddleChange, withJobLabel, withRiddles } from './denormalizeClues';
import { normalizeSyllable, riddlesOf } from './riddles';
import { sameJson } from './same';
import type { JobDoc, PlaceDoc } from './types';

const place = (patch: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Rome',
  code: 'IT',
  latitude: 41,
  longitude: 12,
  difficulty: 'easy',
  ...patch,
});

const withClues = (syllables: string[], riddles?: (string | null)[], patch: Partial<PlaceDoc> = {}): PlaceDoc =>
  place({
    clues: {
      positionInCountry: 'n',
      population: 1,
      climateEmoji: '☀️',
      elevationMeters: 1,
      timezone: 'Europe/Rome',
      airportCode: 'AAA',
      emojis: ['a', 'b', 'c'],
      syllables,
      ...(riddles && { riddles }),
    },
    ...patch,
  });

const jobs: Record<string, JobDoc> = { emp: { fr: 'empereur', en: 'emperor' } };
const riddles = { ro: 'un rôle', me: null };

describe('sameJson', () => {
  it('compares plain values whatever the order of the object keys, at any depth', () => {
    expect(sameJson({ a: 1, b: { c: [1, { d: 2, e: 3 }] } }, { b: { c: [1, { e: 3, d: 2 }] }, a: 1 })).toBe(true);
    expect(sameJson({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameJson([1, 2], [2, 1])).toBe(false);
    expect(sameJson(null, null)).toBe(true);
    expect(sameJson(undefined, undefined)).toBe(true);
  });

  it('sorts keys in both directions', () => {
    expect(sameJson({ b: 1, a: 2, c: 3 }, { c: 3, a: 2, b: 1 })).toBe(true);
  });
});

describe('riddles', () => {
  it('folds accents onto the dictionary key and gives null for a syllable with no riddle', () => {
    expect(normalizeSyllable('Pâ')).toBe('pa');
    expect(riddlesOf(['ro', 'Me', 'xx'], riddles)).toEqual(['un rôle', null, null]);
  });
});

describe('withRiddles / withJobLabel', () => {
  it('copies the riddle of each syllable, and leaves a place without Clues data alone', () => {
    expect(withRiddles(withClues(['ro', 'me']), riddles).clues?.riddles).toEqual(['un rôle', null]);
    const bare = place();
    expect(withRiddles(bare, riddles)).toBe(bare);
  });

  it('copies the label of the personality job, drops it when there is no job, leaves a place without personality alone', () => {
    const tagged = place({ personality: { name: 'Jules', jobCode: 'emp' } });
    expect(withJobLabel(tagged, jobs).personality).toEqual({
      name: 'Jules',
      jobCode: 'emp',
      job: { fr: 'empereur', en: 'emperor' },
    });
    const jobless = place({ personality: { name: 'Jules', jobCode: null, job: { fr: 'x', en: 'y' } } });
    expect(withJobLabel(jobless, jobs).personality).toEqual({ name: 'Jules', jobCode: null });
    const unknown = place({ personality: { name: 'Jules', jobCode: 'zzz' } });
    expect(withJobLabel(unknown, jobs).personality).toEqual({ name: 'Jules', jobCode: 'zzz' });
    const bare = place();
    expect(withJobLabel(bare, jobs)).toBe(bare);
  });
});

describe('planRiddleChange', () => {
  const places = {
    rome: withRiddles(withClues(['ro', 'me']), riddles),
    accent: withRiddles(withClues(['rô', 'ma']), { ...riddles, ro: 'un rôle', ma: null }),
    other: withRiddles(withClues(['lo', 'ma']), { lo: null, ma: null }),
    bare: place(),
  };

  it('rewrites the riddles of every place holding the syllable, accents folded, and only those', () => {
    const plan = planRiddleChange('ro', 'un autre rôle', places, riddles);
    expect(Object.keys(plan)).toEqual(['rome']);
    expect(plan.rome.clues?.riddles).toEqual(['un autre rôle', null]);
  });

  it('skips a place that already carries the new riddle', () => {
    expect(planRiddleChange('ro', 'un rôle', places, riddles)).toEqual({});
  });

  it('clears a riddle with null', () => {
    expect(planRiddleChange('me', null, places, riddles)).toEqual({});
    expect(planRiddleChange('ro', null, places, riddles).rome.clues?.riddles).toEqual([null, null]);
  });
});

describe('planJobChange', () => {
  const tagged = (code: string | null, job?: { fr: string; en: string }) =>
    place({ personality: { name: 'Jules', jobCode: code, ...(job && { job }) } });
  const places = {
    stale: tagged('emp', { fr: 'roi', en: 'king' }),
    none: tagged('emp'),
    fresh: tagged('emp', { fr: 'empereur', en: 'emperor' }),
    other: tagged('act'),
    jobless: tagged(null),
    bare: place(),
  };

  it('copies the new label into every personality tagged with the job, skipping the ones already up to date', () => {
    const plan = planJobChange('emp', { fr: 'empereur', en: 'emperor' }, places);
    expect(Object.keys(plan)).toEqual(['stale', 'none']);
    expect(plan.stale.personality?.job).toEqual({ fr: 'empereur', en: 'emperor' });
  });
});
