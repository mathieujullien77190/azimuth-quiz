import { Timestamp } from 'firebase/firestore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { encodeRing } from '@/data/firestore/polyline';
import type { CluesDoc, CountryDoc, PlaceDoc } from '@/data/firestore/types';

type Op = {
  op: 'set' | 'update' | 'delete';
  ref: { collection: string; id: string };
  value?: unknown;
  options?: unknown;
};
type Listener = {
  q: { name: string; constraints: { kind: string; field?: string; value?: unknown }[] };
  next: (snapshot: unknown) => void;
  error: (error: unknown) => void;
};

const h = vi.hoisted(() => ({
  collections: {} as Record<string, Record<string, unknown>>,
  meta: {} as Record<string, unknown>,
  journal: [] as { id: string; at: number }[],
  batches: [] as { ops: Op[]; committed: boolean }[],
  getDocReads: [] as string[],
  autoId: 0,
  snapshot: null as unknown,
  listener: null as unknown,
  unsubscribe: undefined as unknown as () => void,
  readSnapshot: undefined as unknown as () => Promise<unknown>,
  writeSnapshot: undefined as unknown as (value: unknown) => Promise<void>,
}));

vi.mock('firebase/firestore', () => {
  class FakeTimestamp {
    constructor(private readonly ms: number) {}
    static fromMillis = (ms: number) => new FakeTimestamp(ms);
    toMillis() {
      return this.ms;
    }
  }
  const valueAt = (collection: string, id: string) =>
    collection === 'meta' ? h.meta[id] : h.collections[collection]?.[id];
  return {
    Timestamp: FakeTimestamp,
    collection: (_db: unknown, name: string) => ({ kind: 'collection', name }),
    doc: (first: { kind?: string; name?: string }, collection?: string, id?: string) =>
      first.kind === 'collection' ? { collection: first.name, id: `auto${(h.autoId += 1)}` } : { collection, id },
    where: (field: string, _op: string, value: unknown) => ({ kind: 'where', field, value }),
    orderBy: (field: string) => ({ kind: 'orderBy', field }),
    limit: (value: number) => ({ kind: 'limit', value }),
    query: (ref: { name: string }, ...constraints: unknown[]) => ({ kind: 'query', name: ref.name, constraints }),
    increment: (value: number) => ({ increment: value }),
    serverTimestamp: () => 'SERVER_TS',
    getDocs: async (ref: { kind: string; name: string }) => {
      if (ref.kind === 'query') {
        const sorted = [...h.journal].sort((a, b) => b.at - a.at).slice(0, 1);
        return { docs: sorted.map(({ id, at }) => ({ id, data: () => ({ at: new FakeTimestamp(at) }) })) };
      }
      const entries = Object.entries(h.collections[ref.name] ?? {});
      return { docs: entries.map(([id, value]) => ({ id, data: () => value })) };
    },
    getDoc: async (ref: { collection: string; id: string }) => {
      h.getDocReads.push(`${ref.collection}/${ref.id}`);
      const value = valueAt(ref.collection, ref.id);
      return { exists: () => value !== undefined, data: () => value };
    },
    onSnapshot: (q: Listener['q'], next: Listener['next'], error: Listener['error']) => {
      h.listener = { q, next, error };
      return h.unsubscribe;
    },
    writeBatch: () => {
      const batch = { ops: [] as Op[], committed: false };
      h.batches.push(batch);
      return {
        set: (ref: Op['ref'], value: unknown, options?: unknown) => batch.ops.push({ op: 'set', ref, value, options }),
        update: (ref: Op['ref'], value: unknown) => batch.ops.push({ op: 'update', ref, value }),
        delete: (ref: Op['ref']) => batch.ops.push({ op: 'delete', ref }),
        commit: async () => {
          batch.committed = true;
        },
      };
    },
  };
});

vi.mock('./firebase', () => ({ db: {}, auth: {} }));
vi.mock('./snapshotStore', () => ({
  readSnapshot: () => h.readSnapshot(),
  writeSnapshot: (value: unknown) => h.writeSnapshot(value),
}));

type DataModule = typeof import('./data');
let mod: DataModule;

const place = (overrides: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Paris',
  code: 'FR',
  latitude: 48.8,
  longitude: 2.3,
  difficulty: 'easy',
  ...overrides,
});

const cluesDoc = (overrides: Partial<CluesDoc> = {}): CluesDoc => ({
  positionInCountry: 'center',
  population: 1,
  climateEmoji: 'x',
  elevationMeters: 1,
  timezone: 'Europe/Paris',
  airportCode: 'CDG',
  emojis: [],
  ...overrides,
});

type CacheShape = Awaited<ReturnType<typeof snapshotCache>>;
const snapshotCache = async (overrides: Record<string, unknown> = {}) => ({
  places: {} as Record<string, PlaceDoc>,
  countries: {} as Record<string, CountryDoc>,
  jobs: {} as Record<string, { fr: string; en: string }>,
  compassCounts: {},
  compassShuffled: false,
  cluesCounts: {},
  cluesShuffled: false,
  ...overrides,
});

const load = async (overrides: Record<string, unknown> = {}, journalAt: number | null = 100): Promise<CacheShape> => {
  const cache = await snapshotCache(overrides);
  h.snapshot = { cache, syncedAt: 1, journalAt };
  await mod.loadData();
  return cache;
};

const lastBatch = () => h.batches[h.batches.length - 1];
const summary = (batch = lastBatch()) => batch.ops.map(({ op, ref }) => `${op} ${ref.collection}/${ref.id}`);
const journalEntry = (batch = lastBatch()) => batch.ops.find((op) => op.ref.collection === 'journal')!;
const versionOp = (batch = lastBatch()) => batch.ops.find((op) => op.ref.id === 'dataVersion')!;

const expectBookkeeping = (changes: unknown[], batch = lastBatch()) => {
  expect(versionOp(batch)).toMatchObject({
    op: 'set',
    value: { version: { increment: 1 }, updatedAt: expect.any(Number) },
    options: { merge: true },
  });
  expect(journalEntry(batch)).toMatchObject({ op: 'set', value: { at: 'SERVER_TS', changes } });
};

const flush = () => vi.advanceTimersByTimeAsync(400);

beforeEach(async () => {
  vi.useFakeTimers();
  vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  h.collections = {};
  h.meta = {};
  h.journal = [];
  h.batches = [];
  h.getDocReads = [];
  h.autoId = 0;
  h.snapshot = null;
  h.listener = null;
  h.unsubscribe = vi.fn();
  h.readSnapshot = vi.fn(async () => h.snapshot);
  h.writeSnapshot = vi.fn(async () => {});
  vi.resetModules();
  mod = await import('./data');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('data / loadData', () => {
  it('throws while nothing is loaded', () => {
    expect(() => mod.data()).toThrow('Données non chargées');
  });

  it('does a full sync when there is no stored copy, and stores the result', async () => {
    h.collections.places = { par: place() };
    h.collections.countries = { FR: { fr: 'France', en: 'France' } };
    h.collections.personalityJobs = { cha: { fr: 'chanteuse', en: 'singer' } };
    h.meta.compassCounts = { counts: { capital: { easy: 1 } }, shuffled: true };
    h.meta.cluesCounts = { counts: { capital: { easy: 1 } }, shuffled: true };
    h.journal = [
      { id: 'a', at: 10 },
      { id: 'b', at: 50 },
    ];

    await mod.loadData();

    expect(mod.data()).toEqual({
      places: { par: place() },
      countries: { FR: { fr: 'France', en: 'France' } },
      jobs: { cha: { fr: 'chanteuse', en: 'singer' } },
      compassCounts: { capital: { easy: 1 } },
      compassShuffled: true,
      cluesCounts: { capital: { easy: 1 } },
      cluesShuffled: true,
    });
    expect(h.writeSnapshot).toHaveBeenCalledWith({ cache: mod.data(), syncedAt: Date.now(), journalAt: 50 });
  });

  it('defaults the counts and the journal position when Firestore has none', async () => {
    await mod.loadData();

    expect(mod.data()).toMatchObject({
      places: {},
      compassCounts: {},
      compassShuffled: false,
      cluesCounts: {},
      cluesShuffled: false,
    });
    expect(h.writeSnapshot).toHaveBeenCalledWith(expect.objectContaining({ journalAt: 0 }));
  });

  it('reads the stored copy without any Firestore read, dropping the obsolete contours key', async () => {
    const cache = await snapshotCache({ contours: { old: true }, places: { par: place() } });
    h.snapshot = { cache, syncedAt: 1, journalAt: 100 };

    await mod.loadData();

    expect(mod.data().places).toEqual({ par: place() });
    expect(mod.data()).not.toHaveProperty('contours');
    expect(h.writeSnapshot).not.toHaveBeenCalled();
  });

  it('does a full sync when the stored copy has no journal position', async () => {
    h.collections.places = { lyo: place({ name: 'Lyon' }) };
    h.snapshot = { cache: await snapshotCache(), syncedAt: 1 };

    await mod.loadData();

    expect(Object.keys(mod.data().places)).toEqual(['lyo']);
    expect(h.writeSnapshot).toHaveBeenCalledTimes(1);
  });
});

describe('data / countryName and contours', () => {
  const silhouette = (): CountryDoc => ({
    fr: 'Autriche',
    en: 'Austria',
    ring: encodeRing([
      [0, 0],
      [1, 0],
      [1, 1],
    ]),
    difficulty: 'hard',
    centerLabel: { x: 0.4, y: 0.6 },
    neighbors: [
      { code: 'DE', fr: 'Allemagne', en: 'Germany', x: 0.1, y: 0.2 },
      { code: 'CZ', fr: 'Tchéquie', en: 'Czechia', ring: encodeRing([[0, 0]]) },
    ],
  });

  it('gives the French name of a known country and the code of an unknown one', async () => {
    await load({ countries: { FR: { fr: 'France', en: 'France' } } });

    expect(mod.countryName('FR')).toBe('France');
    expect(mod.countryName('ZZ')).toBe('ZZ');
  });

  it('decodes only the countries that have a silhouette, once', async () => {
    await load({ countries: { AT: silhouette(), FR: { fr: 'France', en: 'France' } } });

    const first = mod.contours();

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      code: 'AT',
      difficulty: 'hard',
      centerLabel: { x: 0.4, y: 0.6 },
      neighbors: [{ code: 'DE', x: 0.1, y: 0.2 }],
    });
    expect(mod.contours()).toBe(first);
  });

  it('decodes again after a country write', async () => {
    await load({ countries: { AT: silhouette() } });
    const first = mod.contours();

    await mod.putCountry('AT', { ...silhouette(), difficulty: 'easy' });

    expect(mod.contours()).not.toBe(first);
    expect(mod.contours()[0].difficulty).toBe('easy');
  });
});

describe('data / revision', () => {
  it('starts at 0 and stops notifying a listener once it unsubscribed', async () => {
    await load();
    const listener = vi.fn();
    const unsubscribe = mod.subscribeRevision(listener);
    expect(mod.dataRevision()).toBe(0);

    mod.startJournalSync();
    const emit = (id: string) =>
      (h.listener as Listener).next({
        docChanges: () => [
          {
            type: 'added',
            doc: {
              id,
              data: () => ({ at: Timestamp.fromMillis(500), changes: [{ c: 'places', id: 'x', op: 'delete' }] }),
            },
          },
        ],
      });
    emit('e1');
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(mod.dataRevision()).toBe(1);

    unsubscribe();
    emit('e2');
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(mod.dataRevision()).toBe(2);
  });
});

describe('data / startJournalSync', () => {
  type Entry = { id: string; at: number | null; changes?: { c: string; id: string; op: string }[] };
  const emit = (entries: Entry[], type = 'added') =>
    (h.listener as Listener).next({
      docChanges: () =>
        entries.map(({ id, at, changes = [] }) => ({
          type,
          doc: { id, data: () => ({ at: at === null ? null : Timestamp.fromMillis(at), changes }) },
        })),
    });

  it('listens to the entries newer than the stored journal position and returns the unsubscribe function', async () => {
    await load({}, 123);

    const unsubscribe = mod.startJournalSync();

    const where = (h.listener as Listener).q.constraints.find((c) => c.kind === 'where')!;
    expect((where.value as Timestamp).toMillis()).toBe(123);
    expect(unsubscribe).toBe(h.unsubscribe);
  });

  it('starts from 0 when no position is known yet', () => {
    mod.startJournalSync();

    const where = (h.listener as Listener).q.constraints.find((c) => c.kind === 'where')!;
    expect((where.value as Timestamp).toMillis()).toBe(0);
  });

  it('logs listener errors', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mod.startJournalSync();

    (h.listener as Listener).error('boom');

    expect(error).toHaveBeenCalledWith('[journal]', 'boom');
  });

  it('ignores snapshots without any added entry', async () => {
    await load();
    mod.startJournalSync();

    emit([{ id: 'm', at: 900 }], 'modified');
    await flush();

    expect(mod.dataRevision()).toBe(0);
    expect(h.writeSnapshot).not.toHaveBeenCalled();
  });

  it('re-reads the documents a foreign entry names and puts them in the local copy', async () => {
    await load({
      places: { par: place({ name: 'old' }), gone: place() },
      countries: { FR: { fr: 'old', en: 'old' } },
      jobs: { cha: { fr: 'old', en: 'old' } },
      compassCounts: { cities: { easy: 9 } },
      cluesCounts: { cities: { easy: 9 } },
    });
    h.collections.places = { par: place({ name: 'new' }) };
    h.collections.countries = { FR: { fr: 'France', en: 'France' } };
    h.collections.personalityJobs = { cha: { fr: 'chanteuse', en: 'singer' } };
    h.meta.compassCounts = { counts: { capital: { easy: 1 } }, shuffled: true };
    h.meta.cluesCounts = { counts: { capital: { hard: 2 } } };
    mod.startJournalSync();

    emit([
      {
        id: 'e1',
        at: 700,
        changes: [
          { c: 'places', id: 'par', op: 'set' },
          { c: 'places', id: 'gone', op: 'delete' },
          { c: 'countries', id: 'FR', op: 'set' },
          { c: 'personalityJobs', id: 'cha', op: 'set' },
          { c: 'removedCollection' as never, id: 'pa', op: 'set' },
          { c: 'meta', id: 'compassCounts', op: 'set' },
          { c: 'meta', id: 'cluesCounts', op: 'set' },
          { c: 'meta', id: 'dataVersion', op: 'set' },
        ],
      },
    ]);
    await flush();

    const copy = mod.data();
    expect(copy.places).toEqual({ par: place({ name: 'new' }) });
    expect(copy.countries.FR).toEqual({ fr: 'France', en: 'France' });
    expect(copy.jobs.cha).toEqual({ fr: 'chanteuse', en: 'singer' });
    expect(copy.compassCounts).toEqual({ capital: { easy: 1 } });
    expect(copy.compassShuffled).toBe(true);
    expect(copy.cluesCounts).toEqual({ capital: { hard: 2 } });
    expect(copy.cluesShuffled).toBe(false);
    expect(h.getDocReads).not.toContain('places/gone');
    expect(mod.dataRevision()).toBe(1);
    expect(h.writeSnapshot).toHaveBeenCalledWith({ cache: copy, syncedAt: expect.any(Number), journalAt: 700 });
  });

  it('resets the counts when the meta documents were removed', async () => {
    await load({
      compassCounts: { cities: { easy: 9 } },
      compassShuffled: true,
      cluesCounts: { cities: { easy: 9 } },
      cluesShuffled: true,
    });
    mod.startJournalSync();

    emit([
      {
        id: 'e1',
        at: 700,
        changes: [
          { c: 'meta', id: 'compassCounts', op: 'set' },
          { c: 'meta', id: 'cluesCounts', op: 'delete' },
        ],
      },
    ]);
    await flush();

    expect(mod.data()).toMatchObject({
      compassCounts: {},
      compassShuffled: false,
      cluesCounts: {},
      cluesShuffled: false,
    });
  });

  it('skips the entries this admin wrote itself but still moves the journal position', async () => {
    await load();
    await mod.putJob('cha', { fr: 'chanteuse', en: 'singer' });
    const ownId = journalEntry().ref.id;
    mod.startJournalSync();

    emit([{ id: ownId, at: 800, changes: [{ c: 'personalityJobs', id: 'cha', op: 'set' }] }]);
    await flush();

    expect(h.getDocReads).toEqual([]);
    expect(mod.dataRevision()).toBe(0);
    expect(h.writeSnapshot).toHaveBeenCalledWith(expect.objectContaining({ journalAt: 800 }));
  });

  it('keeps the journal position when the entries have no server time yet', async () => {
    await load({}, 100);
    mod.startJournalSync();

    emit([{ id: 'pending', at: null }]);
    await flush();

    expect(h.writeSnapshot).toHaveBeenCalledWith(expect.objectContaining({ journalAt: 100 }));
  });

  it('takes the newest time of several entries and handles them in order', async () => {
    await load({}, 100);
    mod.startJournalSync();

    emit([
      { id: 'a', at: 300 },
      { id: 'b', at: 200 },
    ]);
    emit([{ id: 'c', at: 250 }]);
    await flush();

    expect(h.writeSnapshot).toHaveBeenCalledTimes(1);
    expect(h.writeSnapshot).toHaveBeenCalledWith(expect.objectContaining({ journalAt: 300 }));
  });

  it('falls back to a full read when too many documents changed', async () => {
    await load({ places: { old: place() } });
    h.collections.places = { fresh: place({ name: 'Fresh' }) };
    mod.startJournalSync();

    emit([
      {
        id: 'big',
        at: 900,
        changes: Array.from({ length: 1001 }, (_, index) => ({ c: 'places', id: `p${index}`, op: 'set' })),
      },
    ]);
    await flush();

    expect(Object.keys(mod.data().places)).toEqual(['fresh']);
    expect(h.getDocReads.filter((read) => read.startsWith('places/'))).toEqual([]);
    expect(mod.dataRevision()).toBe(1);
  });

  it('does not touch the copy of an entry arriving before the data is loaded', async () => {
    mod.startJournalSync();

    emit([{ id: 'x', at: 400, changes: [{ c: 'places', id: 'par', op: 'delete' }] }]);
    await flush();

    expect(mod.dataRevision()).toBe(0);
    expect(h.writeSnapshot).not.toHaveBeenCalled();
  });
});

describe('data / single document writes', () => {
  it('putPlace writes the place, the data version and the journal in one batch, then updates the copy', async () => {
    await load();
    const next = place({ name: 'Paris' });

    await mod.putPlace('par', next);

    expect(summary()).toEqual(['set places/par', 'set meta/dataVersion', expect.stringMatching(/^set journal\//)]);
    expect(lastBatch().ops[0].value).toBe(next);
    expect(lastBatch().committed).toBe(true);
    expectBookkeeping([{ c: 'places', id: 'par', op: 'set' }]);
    expect(mod.data().places.par).toBe(next);
  });

  it('putCountry rewrites the country', async () => {
    await load();

    await mod.putCountry('FR', { fr: 'France', en: 'France' });

    expect(summary()[0]).toBe('set countries/FR');
    expectBookkeeping([{ c: 'countries', id: 'FR', op: 'set' }]);
    expect(mod.data().countries.FR).toEqual({ fr: 'France', en: 'France' });
  });

  it('putJob and removeJob write then delete the job', async () => {
    await load();

    await mod.putJob('cha', { fr: 'chanteuse', en: 'singer' });
    expect(summary()[0]).toBe('set personalityJobs/cha');
    expect(mod.data().jobs.cha).toEqual({ fr: 'chanteuse', en: 'singer' });

    await mod.removeJob('cha');
    expect(summary()[0]).toBe('delete personalityJobs/cha');
    expectBookkeeping([{ c: 'personalityJobs', id: 'cha', op: 'delete' }]);
    expect(mod.data().jobs).toEqual({});
  });

  it('stores the copy once after a burst of writes', async () => {
    await load();

    await mod.putJob('a', { fr: 'a', en: 'a' });
    await mod.putJob('b', { fr: 'b', en: 'b' });
    expect(h.writeSnapshot).not.toHaveBeenCalled();
    await flush();

    expect(h.writeSnapshot).toHaveBeenCalledTimes(1);
    expect(h.writeSnapshot).toHaveBeenCalledWith({ cache: mod.data(), syncedAt: 1, journalAt: 100 });
  });
});

describe('data / applyCountryChange', () => {
  it('writes the country, the copy in its places and the names in the countries citing it, in one batch', async () => {
    await load({
      places: {
        par: place({ country: { fr: 'old', en: 'old' } }),
        rom: place({ name: 'Rome', code: 'IT' }),
        lyo: place({ name: 'Lyon', country: { fr: 'France', en: 'France' }, code: 'FR' }),
      },
      countries: {
        FR: { fr: 'old', en: 'old' },
        DE: { fr: 'Allemagne', en: 'Germany', neighbors: [{ code: 'FR', fr: 'old', en: 'old' }] },
        IT: { fr: 'Italie', en: 'Italy' },
      },
    });
    const next: CountryDoc = { fr: 'France', en: 'France', currency: 'EUR' };

    await mod.applyCountryChange('FR', next);

    expect(summary()).toEqual([
      'set countries/FR',
      'update places/par',
      'update places/lyo',
      'set countries/DE',
      'set meta/dataVersion',
      expect.stringMatching(/^set journal\//),
    ]);
    expect(lastBatch().ops[0].value).toBe(next);
    expect(lastBatch().ops[1].value).toEqual({ country: { fr: 'France', en: 'France', currency: 'EUR' } });
    expect((lastBatch().ops[3].value as CountryDoc).neighbors).toEqual([{ code: 'FR', fr: 'France', en: 'France' }]);
    expectBookkeeping([
      { c: 'countries', id: 'FR', op: 'set' },
      { c: 'places', id: 'par', op: 'set' },
      { c: 'places', id: 'lyo', op: 'set' },
      { c: 'countries', id: 'DE', op: 'set' },
    ]);
    const copy = mod.data();
    expect(copy.countries.FR).toBe(next);
    expect(copy.places.par.country).toEqual({ fr: 'France', en: 'France', currency: 'EUR' });
    expect(copy.countries.DE.neighbors![0].fr).toBe('France');
    expect(copy.places.rom.country).toBeUndefined();
  });

  it('splits more than 400 operations in several batches, the bookkeeping only in the last one', async () => {
    const places = Object.fromEntries(Array.from({ length: 450 }, (_, index) => [`p${index}`, place()]));
    await load({ places, countries: { FR: { fr: 'France', en: 'France' } } });

    await mod.applyCountryChange('FR', { fr: 'France', en: 'France', currency: 'EUR' });

    expect(h.batches.map((batch) => batch.ops.length)).toEqual([400, 53]);
    expect(h.batches.every((batch) => batch.committed)).toBe(true);
    expect(h.batches[0].ops.some((op) => op.ref.id === 'dataVersion')).toBe(false);
    expect(h.batches[0].ops.some((op) => op.ref.collection === 'journal')).toBe(false);
    expect(versionOp(h.batches[1])).toBeDefined();
    expect((journalEntry(h.batches[1]).value as { changes: unknown[] }).changes).toHaveLength(451);
  });
});

describe('data / applyContourDifficultyChange', () => {
  const countries = (): Record<string, CountryDoc> => ({
    A: { fr: 'A', en: 'A', difficulty: 'easy', n: 1 },
    B: { fr: 'B', en: 'B', difficulty: 'easy', n: 2 },
    C: { fr: 'C', en: 'C', difficulty: 'hard', n: 1 },
    X: { fr: 'X', en: 'X' },
  });

  it('does nothing for an unknown country or an unchanged difficulty', async () => {
    await load({ countries: countries() });

    await mod.applyContourDifficultyChange('nope', 'hard');
    await mod.applyContourDifficultyChange('A', 'easy');

    expect(h.batches).toEqual([]);
  });

  it('renumbers the groups: own number, moved country, counts, and keeps the shuffled marker', async () => {
    await load({ countries: countries() });
    h.meta.contourCounts = { counts: { easy: 2, hard: 1 }, shuffled: true };

    await mod.applyContourDifficultyChange('A', 'hard');

    expect(summary()).toEqual([
      'set countries/A',
      'update countries/B',
      'set meta/contourCounts',
      'set meta/dataVersion',
      expect.stringMatching(/^set journal\//),
    ]);
    expect(lastBatch().ops[0].value).toEqual({ fr: 'A', en: 'A', difficulty: 'hard', n: 2 });
    expect(lastBatch().ops[1].value).toEqual({ n: 1 });
    expect(lastBatch().ops[2].value).toEqual({ counts: { easy: 1, hard: 2 }, shuffled: true });
    expectBookkeeping([
      { c: 'countries', id: 'A', op: 'set' },
      { c: 'countries', id: 'B', op: 'set' },
      { c: 'meta', id: 'contourCounts', op: 'set' },
    ]);
    expect(mod.data().countries.A).toMatchObject({ difficulty: 'hard', n: 2 });
    expect(mod.data().countries.B.n).toBe(1);
  });

  it('writes counts without the marker when the stored document is missing', async () => {
    await load({ countries: countries() });

    await mod.applyContourDifficultyChange('B', 'hard');

    expect(lastBatch().ops.find((op) => op.ref.id === 'contourCounts')!.value).toEqual({
      counts: { hard: 1 },
    });
    expect(mod.data().countries.B).toMatchObject({ difficulty: 'hard', n: 1 });
  });
});

describe('data / applyJobChange', () => {
  it('writes the job and copies its label into the personalities tagged with it', async () => {
    await load({
      places: {
        par: place({ personality: { name: 'Edith', jobCode: 'cha', job: { fr: 'old', en: 'old' } } }),
        lyo: place({ name: 'Lyon', personality: { name: 'Paul', jobCode: 'foo' } }),
      },
      jobs: { cha: { fr: 'old', en: 'old' } },
    });

    await mod.applyJobChange('cha', { fr: 'chanteuse', en: 'singer' });

    expect(summary()).toEqual([
      'set personalityJobs/cha',
      'set places/par',
      'set meta/dataVersion',
      expect.stringMatching(/^set journal\//),
    ]);
    expect((lastBatch().ops[1].value as PlaceDoc).personality!.job).toEqual({ fr: 'chanteuse', en: 'singer' });
    expectBookkeeping([
      { c: 'personalityJobs', id: 'cha', op: 'set' },
      { c: 'places', id: 'par', op: 'set' },
    ]);
    expect(mod.data().jobs.cha).toEqual({ fr: 'chanteuse', en: 'singer' });
    expect(mod.data().places.par.personality!.job).toEqual({ fr: 'chanteuse', en: 'singer' });
  });
});

describe('data / applyPlaceChange', () => {
  const capitals = () => ({
    par: place({ compass: { category: 'capital' }, n: 1, clues: cluesDoc({ category: 'capital', n: 1 }) }),
    rom: place({
      name: 'Rome',
      code: 'IT',
      compass: { category: 'capital' },
      n: 2,
      clues: cluesDoc({ category: 'capital', n: 2 }),
    }),
  });
  const counts = { capital: { easy: 2 } };

  it('deletes a place: the last one of each group takes its number, counts follow, everything in one batch', async () => {
    await load({ places: capitals(), compassCounts: counts, compassShuffled: true, cluesCounts: counts });

    await mod.applyPlaceChange('par', null);

    expect(h.batches).toHaveLength(1);
    expect(summary()).toEqual([
      'delete places/par',
      'update places/rom',
      'update places/rom',
      'set meta/compassCounts',
      'set meta/cluesCounts',
      'set meta/dataVersion',
      expect.stringMatching(/^set journal\//),
    ]);
    expect(lastBatch().ops[1].value).toEqual({ n: 1 });
    expect(lastBatch().ops[2].value).toEqual({ 'clues.n': 1 });
    expect(lastBatch().ops[3].value).toEqual({ counts: { capital: { easy: 1 } }, shuffled: true });
    expect(lastBatch().ops[4].value).toEqual({ counts: { capital: { easy: 1 } } });
    expectBookkeeping([
      { c: 'places', id: 'par', op: 'delete' },
      { c: 'places', id: 'rom', op: 'set' },
      { c: 'places', id: 'rom', op: 'set' },
      { c: 'meta', id: 'compassCounts', op: 'set' },
      { c: 'meta', id: 'cluesCounts', op: 'set' },
    ]);
    const copy = mod.data();
    expect(copy.places.par).toBeUndefined();
    expect(copy.places.rom.n).toBe(1);
    expect(copy.places.rom.clues!.n).toBe(1);
    expect(copy.compassCounts).toEqual({ capital: { easy: 1 } });
    expect(copy.cluesCounts).toEqual({ capital: { easy: 1 } });
  });

  it('moves a place to another category: it goes last of the new groups and the Clues category follows', async () => {
    await load({ places: capitals(), compassCounts: counts, cluesCounts: counts, cluesShuffled: true });
    const next = { ...capitals().par, compass: { category: 'cities' as const } };

    await mod.applyPlaceChange('par', next);

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(lastBatch().ops[0].op).toBe('set');
    expect(written).toMatchObject({ n: 1, compass: { category: 'cities' }, clues: { category: 'cities', n: 1 } });
    expect(lastBatch().ops[4].value).toEqual({ counts: { capital: { easy: 1 }, cities: { easy: 1 } }, shuffled: true });
    expect(mod.data().places.par).toBe(written);
    expect(mod.data().places.rom).toMatchObject({ n: 1, clues: { n: 1 } });
  });

  it('keeps the numbers of a place that stays in its groups; a place without any keeps none', async () => {
    const unnumbered = place({ compass: { category: 'capital' }, clues: cluesDoc({ category: 'capital' }) });
    await load({
      places: { par: unnumbered },
      compassCounts: { capital: { easy: 1 } },
      cluesCounts: { capital: { easy: 1 } },
    });

    await mod.applyPlaceChange('par', { ...unnumbered, name: 'Paris 2' });

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(written.name).toBe('Paris 2');
    expect(written).not.toHaveProperty('n');
    expect(written.clues).not.toHaveProperty('n');
    expect(lastBatch().ops).toHaveLength(5);
  });

  it('adds a place without Clues data at the end of its Compass group only', async () => {
    await load({ places: capitals(), compassCounts: counts, cluesCounts: counts });
    const added = place({ name: 'Brest', compass: { category: 'citiesFr' } });

    await mod.applyPlaceChange('bre', added);

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(written).toMatchObject({ n: 1 });
    expect(written.clues).toBeUndefined();
    expect(mod.data().places.bre).toBe(written);
    expect(mod.data().compassCounts).toEqual({ capital: { easy: 2 }, citiesFr: { easy: 1 } });
    expect(mod.data().cluesCounts).toEqual(counts);
  });

  it('adds a Clues-only place without a Compass number', async () => {
    await load({ places: {}, compassCounts: {}, cluesCounts: {} });

    await mod.applyPlaceChange('new', place({ clues: cluesDoc() }));

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(written).not.toHaveProperty('n');
    expect(written.clues).toMatchObject({ category: 'cities', n: 1 });
  });
});
