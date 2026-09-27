import AsyncStorage from '@react-native-async-storage/async-storage';

import { INDICES_HISTORY_STORAGE_KEY } from '@/constants';
import type { IndicesPlace } from '@/types';

import { indicesPlaceKey, pickLeastDrawn } from './indicesHistory';
import type { IndicesDrawHistory } from './indicesHistory';

// The module keeps its cache in module-level variables: `jest.isolateModules` gives each test
// (or group of tests that must share state) a fresh, un-cached copy instead of leaking the
// previous test's `cached`/`loading` across the whole file.
const freshModule = () => {
  let mod!: typeof import('./indicesHistory');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules needs a synchronous require, not a dynamic import()
    mod = require('./indicesHistory');
  });
  return mod;
};

const place = (name: string, code = 'FR'): Pick<IndicesPlace, 'name' | 'code'> => ({ name, code });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('indicesPlaceKey', () => {
  it('combines country code and name', () => {
    expect(indicesPlaceKey(place('Paris'))).toBe('FR|Paris');
  });
});

describe('pickLeastDrawn', () => {
  const pool = [place('Paris'), place('Lyon'), place('Nice')] as IndicesPlace[];

  it('treats places absent from history as drawn 0 times', () => {
    const picked = pickLeastDrawn(pool, {});
    expect(pool).toContainEqual(picked);
  });

  it('only picks among the places with the lowest draw count', () => {
    const history: IndicesDrawHistory = { 'FR|Paris': 2, 'FR|Lyon': 0, 'FR|Nice': 1 };
    for (let i = 0; i < 20; i += 1) {
      expect(pickLeastDrawn(pool, history).name).toBe('Lyon');
    }
  });

  it('picks among every place tied at the minimum once they all have the same count', () => {
    const history: IndicesDrawHistory = { 'FR|Paris': 3, 'FR|Lyon': 3, 'FR|Nice': 3 };
    const names = new Set<string>();
    for (let i = 0; i < 30; i += 1) names.add(pickLeastDrawn(pool, history).name);
    expect(names.size).toBeGreaterThan(1);
  });
});

describe('loadIndicesHistory', () => {
  it('returns an empty history when nothing is stored', async () => {
    const { loadIndicesHistory } = freshModule();
    expect(await loadIndicesHistory()).toEqual({});
  });

  it('parses whatever was previously saved', async () => {
    await AsyncStorage.setItem(INDICES_HISTORY_STORAGE_KEY, JSON.stringify({ 'FR|Paris': 4 }));
    const { loadIndicesHistory } = freshModule();
    expect(await loadIndicesHistory()).toEqual({ 'FR|Paris': 4 });
  });

  it('falls back to an empty history if reading storage fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { loadIndicesHistory } = freshModule();
    expect(await loadIndicesHistory()).toEqual({});
  });

  it('dedupes concurrent calls onto a single storage read', async () => {
    const { loadIndicesHistory } = freshModule();
    const getItemSpy = AsyncStorage.getItem as jest.Mock;
    getItemSpy.mockClear();
    const [first, second] = await Promise.all([loadIndicesHistory(), loadIndicesHistory()]);
    expect(first).toBe(second);
    expect(getItemSpy).toHaveBeenCalledTimes(1);
  });

  it('returns the cached value without hitting storage again once already loaded', async () => {
    const { loadIndicesHistory } = freshModule();
    await loadIndicesHistory();
    const getItemSpy = AsyncStorage.getItem as jest.Mock;
    getItemSpy.mockClear();
    await loadIndicesHistory();
    expect(getItemSpy).not.toHaveBeenCalled();
  });
});

describe('getCachedIndicesHistory', () => {
  it('is null before the first load resolves', () => {
    const { getCachedIndicesHistory } = freshModule();
    expect(getCachedIndicesHistory()).toBeNull();
  });

  it('reflects the loaded history once resolved', async () => {
    const { loadIndicesHistory, getCachedIndicesHistory } = freshModule();
    await loadIndicesHistory();
    expect(getCachedIndicesHistory()).toEqual({});
  });
});

describe('recordIndicesDraw', () => {
  it('starts a place at 1 the first time it is drawn, with nothing loaded yet', () => {
    const { recordIndicesDraw, getCachedIndicesHistory } = freshModule();
    recordIndicesDraw(place('Paris'));
    expect(getCachedIndicesHistory()).toEqual({ 'FR|Paris': 1 });
  });

  it('increments an existing count without touching other places', async () => {
    const { loadIndicesHistory, recordIndicesDraw, getCachedIndicesHistory } = freshModule();
    await loadIndicesHistory();
    recordIndicesDraw(place('Paris'));
    recordIndicesDraw(place('Paris'));
    recordIndicesDraw(place('Lyon'));
    expect(getCachedIndicesHistory()).toEqual({ 'FR|Paris': 2, 'FR|Lyon': 1 });
  });

  it('persists the updated history to storage', async () => {
    const { recordIndicesDraw } = freshModule();
    recordIndicesDraw(place('Paris'));
    await Promise.resolve();
    expect(await AsyncStorage.getItem(INDICES_HISTORY_STORAGE_KEY)).toBe(JSON.stringify({ 'FR|Paris': 1 }));
  });

  it('tolerates a failure saving to storage', async () => {
    const { recordIndicesDraw } = freshModule();
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(() => recordIndicesDraw(place('Paris'))).not.toThrow();
  });
});

describe('clearIndicesHistory', () => {
  it('resets the in-memory cache to empty and removes the storage key', async () => {
    const { recordIndicesDraw, clearIndicesHistory, getCachedIndicesHistory, loadIndicesHistory } = freshModule();
    recordIndicesDraw(place('Paris'));
    await Promise.resolve();

    clearIndicesHistory();

    expect(getCachedIndicesHistory()).toEqual({});
    expect(await AsyncStorage.getItem(INDICES_HISTORY_STORAGE_KEY)).toBeNull();
    // A fresh load right after also sees the cleared state, not a stale in-flight read.
    expect(await loadIndicesHistory()).toEqual({});
  });

  it('tolerates a failure removing from storage', () => {
    const { clearIndicesHistory } = freshModule();
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(() => clearIndicesHistory()).not.toThrow();
  });
});
