import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readSnapshot, writeSnapshot } from './snapshotStore';

type Request = {
  result?: unknown;
  error?: unknown;
  onsuccess?: () => void;
  onerror?: () => void;
  onupgradeneeded?: () => void;
};

/** A tiny IndexedDB: one database, one object store, requests answered asynchronously like the real thing. */
const installFakeIndexedDb = ({ failOpen = false, failTransaction = false } = {}) => {
  const stored = new Map<string, unknown>();
  let created = false;
  const close = vi.fn();
  const settle = (request: Request, fail: boolean, result?: unknown) =>
    setTimeout(() => {
      if (fail) {
        request.error = new Error('boom');
        request.onerror?.();
      } else {
        request.result = result;
        request.onsuccess?.();
      }
    }, 0);
  const database = {
    createObjectStore: vi.fn(() => {
      created = true;
    }),
    close,
    transaction: vi.fn(() => ({
      objectStore: () => ({
        get: (key: string) => {
          const request: Request = {};
          settle(request, failTransaction, stored.get(key));
          return request;
        },
        put: (value: unknown, key: string) => {
          const request: Request = {};
          if (!failTransaction) stored.set(key, value);
          settle(request, failTransaction, key);
          return request;
        },
      }),
    })),
  };
  const open = vi.fn(() => {
    const request: Request = {};
    Object.defineProperty(request, 'result', { get: () => database });
    setTimeout(() => {
      if (failOpen) {
        request.error = new Error('blocked');
        request.onerror?.();
        return;
      }
      if (!created) request.onupgradeneeded?.();
      request.onsuccess?.();
    }, 0);
    return request;
  });
  vi.stubGlobal('indexedDB', { open });
  return { stored, database, close, open };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const settled = async <T>(promise: Promise<T>) => {
  await vi.runAllTimersAsync();
  return promise;
};

describe('snapshotStore', () => {
  it('reads null when nothing was stored yet, creating the object store', async () => {
    const fake = installFakeIndexedDb();

    expect(await settled(readSnapshot())).toBeNull();
    expect(fake.open).toHaveBeenCalledWith('azimuth-admin', 1);
    expect(fake.database.createObjectStore).toHaveBeenCalledWith('kv');
    expect(fake.close).toHaveBeenCalledTimes(1);
  });

  it('reads back what was written', async () => {
    const fake = installFakeIndexedDb();
    const value = { places: { par: 1 } };

    await settled(writeSnapshot(value));
    const read = await settled(readSnapshot());

    expect(read).toEqual(value);
    expect(fake.stored.get('snapshot')).toBe(value);
    expect(fake.close).toHaveBeenCalledTimes(2);
  });

  it('reads null when the database cannot be opened', async () => {
    installFakeIndexedDb({ failOpen: true });

    expect(await settled(readSnapshot())).toBeNull();
  });

  it('reads null and closes the database when the read fails', async () => {
    const fake = installFakeIndexedDb({ failTransaction: true });

    expect(await settled(readSnapshot())).toBeNull();
    expect(fake.close).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed write', async () => {
    const fake = installFakeIndexedDb({ failTransaction: true });

    await expect(settled(writeSnapshot({ a: 1 }))).resolves.toBeUndefined();
    expect(fake.stored.size).toBe(0);
    expect(fake.close).toHaveBeenCalledTimes(1);
  });

  it('swallows a write when the database cannot be opened', async () => {
    installFakeIndexedDb({ failOpen: true });

    await expect(settled(writeSnapshot({ a: 1 }))).resolves.toBeUndefined();
  });
});
