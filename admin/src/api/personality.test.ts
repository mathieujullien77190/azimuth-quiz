import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaceDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { places: {} as Record<string, unknown>, jobs: {} as Record<string, unknown> },
  putPlace: undefined as unknown as (key: string, value: unknown) => Promise<void>,
  putJob: undefined as unknown as (code: string, value: unknown) => Promise<void>,
  removeJob: undefined as unknown as (code: string) => Promise<void>,
  applyJobChange: undefined as unknown as (code: string, value: unknown) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  putPlace: (key: string, value: unknown) => h.putPlace(key, value),
  putJob: (code: string, value: unknown) => h.putJob(code, value),
  removeJob: (code: string) => h.removeJob(code),
  applyJobChange: (code: string, value: unknown) => h.applyJobChange(code, value),
}));

import {
  addJob,
  allJobRows,
  deleteJob,
  filterJobRows,
  jobOptions,
  personalityDraftFor,
  saveJobEn,
  saveJobFr,
  savePersonalityJob,
  savePersonalityName,
} from './personality';

const place = (overrides: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Paris',
  code: 'FR',
  latitude: 0,
  longitude: 0,
  difficulty: 'easy',
  ...overrides,
});

const ref = { key: 'par', name: 'Paris', code: 'FR' };

beforeEach(() => {
  h.state.places = {};
  h.state.jobs = {};
  h.putPlace = vi.fn(async () => {});
  h.putJob = vi.fn(async () => {});
  h.removeJob = vi.fn(async () => {});
  h.applyJobChange = vi.fn(async () => {});
});

describe('jobOptions', () => {
  it('lists the jobs alphabetically by French label', () => {
    h.state.jobs = { b: { fr: 'peintre', en: 'painter' }, a: { fr: 'acteur', en: 'actor' } };

    expect(jobOptions()).toEqual([
      { code: 'a', fr: 'acteur' },
      { code: 'b', fr: 'peintre' },
    ]);
  });
});

describe('personalityDraftFor', () => {
  it('reads the name and the job code of a curated personality', () => {
    h.state.places = { par: place({ personality: { name: 'Edith', jobCode: 'cha' } }) };

    expect(personalityDraftFor(ref)).toEqual({ name: 'Edith', jobCode: 'cha' });
  });

  it('starts blank for a place without personality', () => {
    h.state.places = { par: place() };

    expect(personalityDraftFor(ref)).toEqual({ name: '', jobCode: null });
  });
});

describe('savePersonalityName', () => {
  it('removes the personality when the name is cleared', async () => {
    h.state.places = { par: place({ personality: { name: 'Edith', jobCode: 'cha' } }) };

    const draft = await savePersonalityName(ref, { name: 'Edith', jobCode: 'cha' }, '   ');

    expect(draft).toEqual({ name: '', jobCode: null });
    expect(h.putPlace).toHaveBeenCalledWith('par', place());
  });

  it('writes the trimmed name with the job label copied in', async () => {
    h.state.places = { par: place() };
    h.state.jobs = { cha: { fr: 'chanteuse', en: 'singer' } };

    const draft = await savePersonalityName(ref, { name: '', jobCode: 'cha' }, ' Edith ');

    expect(draft).toEqual({ name: 'Edith', jobCode: 'cha' });
    expect(h.putPlace).toHaveBeenCalledWith(
      'par',
      place({ personality: { name: 'Edith', jobCode: 'cha', job: { fr: 'chanteuse', en: 'singer' } } }),
    );
  });
});

describe('savePersonalityJob', () => {
  it('writes the new job code with its label', async () => {
    h.state.places = { par: place() };
    h.state.jobs = { cha: { fr: 'chanteuse', en: 'singer' } };

    const draft = await savePersonalityJob(ref, { name: 'Edith', jobCode: null }, 'cha');

    expect(draft).toEqual({ name: 'Edith', jobCode: 'cha' });
    expect(h.putPlace).toHaveBeenCalledWith(
      'par',
      place({ personality: { name: 'Edith', jobCode: 'cha', job: { fr: 'chanteuse', en: 'singer' } } }),
    );
  });

  it('writes a personality without job when the job is cleared', async () => {
    h.state.places = { par: place() };

    await savePersonalityJob(ref, { name: 'Edith', jobCode: 'cha' }, null);

    expect(h.putPlace).toHaveBeenCalledWith('par', place({ personality: { name: 'Edith', jobCode: null } }));
  });
});

describe('allJobRows', () => {
  it('lists every job by French text with up to 4 example places, ignoring untagged personalities', () => {
    h.state.jobs = { cha: { fr: 'chanteuse', en: 'singer' }, act: { fr: 'acteur', en: 'actor' } };
    h.state.places = {
      p0: place(),
      p1: place({ personality: { name: 'Edith', jobCode: null } }),
      ...Object.fromEntries(
        ['A', 'B', 'C', 'D', 'E'].map((name) => [`s${name}`, place({ personality: { name, jobCode: 'cha' } })]),
      ),
    };

    expect(allJobRows()).toEqual([
      { code: 'act', fr: 'acteur', en: 'actor', examples: [] },
      { code: 'cha', fr: 'chanteuse', en: 'singer', examples: ['A', 'B', 'C', 'D'] },
    ]);
  });
});

describe('filterJobRows', () => {
  const rows = [
    { code: 'cha', fr: 'chanteuse', en: 'singer', examples: [] },
    { code: 'act', fr: 'acteur', en: 'actor', examples: [] },
  ];

  it('keeps every row for a blank query', () => {
    expect(filterJobRows(rows, '  ')).toBe(rows);
  });

  it('matches the French or the English text, ignoring the case', () => {
    expect(filterJobRows(rows, 'CHAN')).toEqual([rows[0]]);
    expect(filterJobRows(rows, 'Actor')).toEqual([rows[1]]);
    expect(filterJobRows(rows, 'zzz')).toEqual([]);
  });
});

describe('addJob', () => {
  it('derives a 3-letter code from the French text without accents', async () => {
    const row = await addJob('Écrivain', 'writer');

    expect(row).toEqual({ code: 'ecr', fr: 'Écrivain', en: 'writer', examples: [] });
    expect(h.putJob).toHaveBeenCalledWith('ecr', { fr: 'Écrivain', en: 'writer' });
  });

  it('numbers the code while it is taken', async () => {
    h.state.jobs = { cha: {}, cha2: {} };

    expect((await addJob('chanteur', 'singer')).code).toBe('cha3');
  });

  it('falls back to "job" when the French text has no letter', async () => {
    expect((await addJob('123', 'x')).code).toBe('job');
  });
});

describe('saveJobFr / saveJobEn / deleteJob', () => {
  const job = { code: 'cha', fr: 'chanteuse', en: 'singer', examples: ['Edith'] };

  it('rewrites the job with the new French text', async () => {
    expect(await saveJobFr(job, 'artiste')).toEqual({ ...job, fr: 'artiste' });
    expect(h.applyJobChange).toHaveBeenCalledWith('cha', { fr: 'artiste', en: 'singer' });
  });

  it('rewrites the job with the new English text', async () => {
    expect(await saveJobEn(job, 'artist')).toEqual({ ...job, en: 'artist' });
    expect(h.applyJobChange).toHaveBeenCalledWith('cha', { fr: 'chanteuse', en: 'artist' });
  });

  it('removes the job', async () => {
    await deleteJob(job);

    expect(h.removeJob).toHaveBeenCalledWith('cha');
  });
});
