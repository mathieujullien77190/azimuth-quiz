import { Timestamp } from 'firebase/firestore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlaceDoc } from '@/firebase/types';

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

vi.mock('../firebase', () => ({ db: {}, auth: {} }));
vi.mock('../snapshotStore', () => ({
  readSnapshot: () => h.readSnapshot(),
  writeSnapshot: (value: unknown) => h.writeSnapshot(value),
}));

type DataModule = typeof import('../data');
let mod: DataModule;

const place = (overrides: Partial<PlaceDoc> = {}): PlaceDoc => ({
  name: 'Paris',
  code: 'FR',
  latitude: 48.8,
  longitude: 2.3,
  difficulty: 'easy',
  ...overrides,
});

type CacheShape = Awaited<ReturnType<typeof snapshotCache>>;
const snapshotCache = async (overrides: Record<string, unknown> = {}) => ({
  places: {} as Record<string, PlaceDoc>,
  compassCounts: {},
  compassShuffled: false,
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
  mod = await import('../data');
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
    h.meta.compassCounts = { counts: { capital: { easy: 1 } }, shuffled: true };
    h.journal = [
      { id: 'a', at: 10 },
      { id: 'b', at: 50 },
    ];

    await mod.loadData();

    expect(mod.data()).toEqual({
      places: { par: place() },
      compassCounts: { capital: { easy: 1 } },
      compassShuffled: true,
    });
    expect(h.writeSnapshot).toHaveBeenCalledWith({ cache: mod.data(), syncedAt: Date.now(), journalAt: 50 });
  });

  it('defaults the counts and the journal position when Firestore has none', async () => {
    await mod.loadData();

    expect(mod.data()).toMatchObject({
      places: {},
      compassCounts: {},
      compassShuffled: false,
    });
    expect(h.writeSnapshot).toHaveBeenCalledWith(expect.objectContaining({ journalAt: 0 }));
  });

  it('reads the stored copy without any Firestore read, dropping the obsolete contours and countries keys', async () => {
    const cache = await snapshotCache({ contours: { old: true }, countries: { FR: { fr: 'France', en: 'France' } }, places: { par: place() } });
    h.snapshot = { cache, syncedAt: 1, journalAt: 100 };

    await mod.loadData();

    expect(mod.data().places).toEqual({ par: place() });
    expect(mod.data()).not.toHaveProperty('contours');
    expect(mod.data()).not.toHaveProperty('countries');
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
      compassCounts: { cities: { easy: 9 } },
    });
    h.collections.places = { par: place({ name: 'new' }) };
    h.meta.compassCounts = { counts: { capital: { easy: 1 } }, shuffled: true };
    mod.startJournalSync();

    emit([
      {
        id: 'e1',
        at: 700,
        changes: [
          { c: 'places', id: 'par', op: 'set' },
          { c: 'places', id: 'gone', op: 'delete' },
          { c: 'countries' as never, id: 'FR', op: 'set' },
          { c: 'removedCollection' as never, id: 'pa', op: 'set' },
          { c: 'meta', id: 'compassCounts', op: 'set' },
          { c: 'meta', id: 'dataVersion', op: 'set' },
        ],
      },
    ]);
    await flush();

    const copy = mod.data();
    expect(copy.places).toEqual({ par: place({ name: 'new' }) });
    expect(copy).not.toHaveProperty('countries');
    expect(copy.compassCounts).toEqual({ capital: { easy: 1 } });
    expect(copy.compassShuffled).toBe(true);
    expect(h.getDocReads).not.toContain('places/gone');
    expect(mod.dataRevision()).toBe(1);
    expect(h.writeSnapshot).toHaveBeenCalledWith({ cache: copy, syncedAt: expect.any(Number), journalAt: 700 });
  });

  it('resets the counts when the meta documents were removed', async () => {
    await load({
      compassCounts: { cities: { easy: 9 } },
      compassShuffled: true,
    });
    mod.startJournalSync();

    emit([
      {
        id: 'e1',
        at: 700,
        changes: [
          { c: 'meta', id: 'compassCounts', op: 'delete' },
        ],
      },
    ]);
    await flush();

    expect(mod.data()).toMatchObject({
      compassCounts: {},
      compassShuffled: false,
    });
  });

  it('skips the entries this admin wrote itself but still moves the journal position', async () => {
    await load();
    await mod.applyPlaceChange('par', place());
    const ownId = journalEntry().ref.id;
    mod.startJournalSync();

    emit([{ id: ownId, at: 800, changes: [{ c: 'places', id: 'par', op: 'set' }] }]);
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

describe('data / persistence', () => {
  it('stores the copy once after a burst of writes', async () => {
    await load();

    await mod.applyPlaceChange('a', place());
    await mod.applyPlaceChange('b', place());
    expect(h.writeSnapshot).not.toHaveBeenCalled();
    await flush();

    expect(h.writeSnapshot).toHaveBeenCalledTimes(1);
    expect(h.writeSnapshot).toHaveBeenCalledWith({ cache: mod.data(), syncedAt: 1, journalAt: 100 });
  });
});

describe('data / applyPlaceChange', () => {
  const capitals = () => ({
    par: place({ compass: { category: 'capital' }, n: 1 }),
    rom: place({
      name: 'Rome',
      code: 'IT',
      compass: { category: 'capital' },
      n: 2,
    }),
  });
  const counts = { capital: { easy: 2 } };

  it('deletes a place: the last one of each group takes its number, counts follow, everything in one batch', async () => {
    await load({ places: capitals(), compassCounts: counts, compassShuffled: true });

    await mod.applyPlaceChange('par', null);

    expect(h.batches).toHaveLength(1);
    expect(summary()).toEqual([
      'delete places/par',
      'update places/rom',
      'set meta/compassCounts',
      'set meta/dataVersion',
      expect.stringMatching(/^set journal\//),
    ]);
    expect(lastBatch().ops[1].value).toEqual({ n: 1 });
    expect(lastBatch().ops[2].value).toEqual({ counts: { capital: { easy: 1 } }, shuffled: true });
    expectBookkeeping([
      { c: 'places', id: 'par', op: 'delete' },
      { c: 'places', id: 'rom', op: 'set' },
      { c: 'meta', id: 'compassCounts', op: 'set' },
    ]);
    const copy = mod.data();
    expect(copy.places.par).toBeUndefined();
    expect(copy.places.rom.n).toBe(1);
    expect(copy.compassCounts).toEqual({ capital: { easy: 1 } });
  });

  it('moves a place to another category: it goes last of the new group', async () => {
    await load({ places: capitals(), compassCounts: counts, compassShuffled: true });
    const next = { ...capitals().par, compass: { category: 'cities' as const } };

    await mod.applyPlaceChange('par', next);

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(lastBatch().ops[0].op).toBe('set');
    expect(written).toMatchObject({ n: 1, compass: { category: 'cities' } });
    expect(lastBatch().ops[2].value).toEqual({ counts: { capital: { easy: 1 }, cities: { easy: 1 } }, shuffled: true });
    expect(mod.data().places.par).toBe(written);
    expect(mod.data().places.rom).toMatchObject({ n: 1 });
  });

  it('keeps the number of a place that stays in its group; a place without one keeps none', async () => {
    const unnumbered = place({ compass: { category: 'capital' } });
    await load({
      places: { par: unnumbered },
      compassCounts: { capital: { easy: 1 } },
    });

    await mod.applyPlaceChange('par', { ...unnumbered, name: 'Paris 2' });

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(written.name).toBe('Paris 2');
    expect(written).not.toHaveProperty('n');
    expect(lastBatch().ops).toHaveLength(4);
  });

  it('adds a place at the end of its Compass group', async () => {
    await load({ places: capitals(), compassCounts: counts });
    const added = place({ name: 'Brest', compass: { category: 'citiesFr' } });

    await mod.applyPlaceChange('bre', added);

    const written = lastBatch().ops[0].value as PlaceDoc;
    expect(written).toMatchObject({ n: 1 });
    expect(mod.data().places.bre).toBe(written);
    expect(mod.data().compassCounts).toEqual({ capital: { easy: 2 }, citiesFr: { easy: 1 } });
  });

  it('adds a place without Compass data without a number', async () => {
    await load({ places: {}, compassCounts: {} });

    await mod.applyPlaceChange('new', place());

    expect(lastBatch().ops[0].value as PlaceDoc).not.toHaveProperty('n');
  });
});
