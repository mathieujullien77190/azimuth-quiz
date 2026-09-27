import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLUE_HISTORY_STORAGE_KEY } from '@/games/clues/constants';
import type { CluePlace } from '@/types';

import { cluePlaceKey, pickLeastDrawn } from './clueHistory';
import type { ClueDrawHistory } from './clueHistory';

// The module keeps its cache in module-level variables: `jest.isolateModules` gives each test
// (or group of tests that must share state) a fresh, un-cached copy instead of leaking the
// previous test's `cached`/`loading` across the whole file.
const freshModule = () => {
  let mod!: typeof import('./clueHistory');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules needs a synchronous require, not a dynamic import()
    mod = require('./clueHistory');
  });
  return mod;
};

const place = (name: string, code = 'FR'): Pick<CluePlace, 'name' | 'code'> => ({ name, code });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('cluePlaceKey', () => {
  it('combines country code and name', () => {
    expect(cluePlaceKey(place('Paris'))).toBe('FR|Paris');
  });
});

describe('pickLeastDrawn', () => {
  const pool = [place('Paris'), place('Lyon'), place('Nice')] as CluePlace[];

  it('treats places absent from history as drawn 0 times', () => {
    const picked = pickLeastDrawn(pool, {});
    expect(pool).toContainEqual(picked);
  });

  it('only picks among the places with the lowest draw count', () => {
    const history: ClueDrawHistory = { 'FR|Paris': 2, 'FR|Lyon': 0, 'FR|Nice': 1 };
    for (let i = 0; i < 20; i += 1) {
      expect(pickLeastDrawn(pool, history).name).toBe('Lyon');
    }
  });

  it('picks among every place tied at the minimum once they all have the same count', () => {
    const history: ClueDrawHistory = { 'FR|Paris': 3, 'FR|Lyon': 3, 'FR|Nice': 3 };
    const names = new Set<string>();
    for (let i = 0; i < 30; i += 1) names.add(pickLeastDrawn(pool, history).name);
    expect(names.size).toBeGreaterThan(1);
  });
});

describe('loadClueHistory', () => {
  it('returns an empty history when nothing is stored', async () => {
    const { loadClueHistory } = freshModule();
    expect(await loadClueHistory()).toEqual({});
  });

  it('parses whatever was previously saved', async () => {
    await AsyncStorage.setItem(CLUE_HISTORY_STORAGE_KEY, JSON.stringify({ 'FR|Paris': 4 }));
    const { loadClueHistory } = freshModule();
    expect(await loadClueHistory()).toEqual({ 'FR|Paris': 4 });
  });

  it('falls back to an empty history if reading storage fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const { loadClueHistory } = freshModule();
    expect(await loadClueHistory()).toEqual({});
  });

  it('dedupes concurrent calls onto a single storage read', async () => {
    const { loadClueHistory } = freshModule();
    const getItemSpy = AsyncStorage.getItem as jest.Mock;
    getItemSpy.mockClear();
    const [first, second] = await Promise.all([loadClueHistory(), loadClueHistory()]);
    expect(first).toBe(second);
    expect(getItemSpy).toHaveBeenCalledTimes(1);
  });

  it('returns the cached value without hitting storage again once already loaded', async () => {
    const { loadClueHistory } = freshModule();
    await loadClueHistory();
    const getItemSpy = AsyncStorage.getItem as jest.Mock;
    getItemSpy.mockClear();
    await loadClueHistory();
    expect(getItemSpy).not.toHaveBeenCalled();
  });
});

describe('getCachedClueHistory', () => {
  it('is null before the first load resolves', () => {
    const { getCachedClueHistory } = freshModule();
    expect(getCachedClueHistory()).toBeNull();
  });

  it('reflects the loaded history once resolved', async () => {
    const { loadClueHistory, getCachedClueHistory } = freshModule();
    await loadClueHistory();
    expect(getCachedClueHistory()).toEqual({});
  });
});

describe('recordClueDraw', () => {
  it('starts a place at 1 the first time it is drawn, with nothing loaded yet', () => {
    const { recordClueDraw, getCachedClueHistory } = freshModule();
    recordClueDraw(place('Paris'));
    expect(getCachedClueHistory()).toEqual({ 'FR|Paris': 1 });
  });

  it('increments an existing count without touching other places', async () => {
    const { loadClueHistory, recordClueDraw, getCachedClueHistory } = freshModule();
    await loadClueHistory();
    recordClueDraw(place('Paris'));
    recordClueDraw(place('Paris'));
    recordClueDraw(place('Lyon'));
    expect(getCachedClueHistory()).toEqual({ 'FR|Paris': 2, 'FR|Lyon': 1 });
  });

  it('persists the updated history to storage', async () => {
    const { recordClueDraw } = freshModule();
    recordClueDraw(place('Paris'));
    await Promise.resolve();
    expect(await AsyncStorage.getItem(CLUE_HISTORY_STORAGE_KEY)).toBe(JSON.stringify({ 'FR|Paris': 1 }));
  });

  it('tolerates a failure saving to storage', async () => {
    const { recordClueDraw } = freshModule();
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(() => recordClueDraw(place('Paris'))).not.toThrow();
  });
});

describe('clearClueHistory', () => {
  it('resets the in-memory cache to empty and removes the storage key', async () => {
    const { recordClueDraw, clearClueHistory, getCachedClueHistory, loadClueHistory } = freshModule();
    recordClueDraw(place('Paris'));
    await Promise.resolve();

    clearClueHistory();

    expect(getCachedClueHistory()).toEqual({});
    expect(await AsyncStorage.getItem(CLUE_HISTORY_STORAGE_KEY)).toBeNull();
    // A fresh load right after also sees the cleared state, not a stale in-flight read.
    expect(await loadClueHistory()).toEqual({});
  });

  it('tolerates a failure removing from storage', () => {
    const { clearClueHistory } = freshModule();
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(() => clearClueHistory()).not.toThrow();
  });
});
