import { planJobChange, withJobLabel } from './denormalizeClues';
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

const jobs: Record<string, JobDoc> = { emp: { fr: 'empereur', en: 'emperor' } };

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

describe('withJobLabel', () => {
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
