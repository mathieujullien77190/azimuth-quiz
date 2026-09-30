import AsyncStorage from '@react-native-async-storage/async-storage';

import { COMPASS_HISTORY_STORAGE_KEY } from '@/games/compass/constants';
import type { Category, Difficulty } from '@/types';

// The module caches in module-level variables: each test gets a fresh copy (same approach as `clueHistory.test.ts`).
const freshModule = () => {
  let mod!: typeof import('./placeHistory');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules needs a synchronous require, not a dynamic import()
    mod = require('./placeHistory');
  });
  return mod;
};

const slot = (n: number, category: Category = 'cities', difficulty: Difficulty = 'easy') => ({ category, difficulty, n });
const stored = async () => JSON.parse((await AsyncStorage.getItem(COMPASS_HISTORY_STORAGE_KEY)) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('placeHistory', () => {
  it('starts empty and reads nothing played', async () => {
    const { loadCompassHistory, hasPlayed } = freshModule();

    const history = await loadCompassHistory();

    expect(history).toEqual({});
    expect(hasPlayed(history, slot(1))).toBe(false);
  });

  it('records plays per group without duplicates, in memory and on the device', async () => {
    const { loadCompassHistory, recordCompassPlays, hasPlayed, groupKey } = freshModule();
    await loadCompassHistory();

    recordCompassPlays([slot(3), slot(5), slot(3), slot(1, 'nature', 'hard')]);

    const history = await loadCompassHistory();
    expect(history).toEqual({ 'cities|easy': [3, 5], 'nature|hard': [1] });
    expect(hasPlayed(history, slot(5))).toBe(true);
    expect(hasPlayed(history, slot(4))).toBe(false);
    expect(groupKey(slot(1, 'nature', 'hard'))).toBe('nature|hard');
    expect(await stored()).toEqual({ 'cities|easy': [3, 5], 'nature|hard': [1] });
  });

  it('records on top of what was already there (before anything was loaded)', () => {
    const { recordCompassPlays, hasPlayed, loadCompassHistory } = freshModule();

    recordCompassPlays([slot(2)]);
    recordCompassPlays([slot(4)]);

    return loadCompassHistory().then((history) => expect(hasPlayed(history, slot(4))).toBe(true));
  });

  it('loads a saved history, sharing one read between concurrent callers', async () => {
    await AsyncStorage.setItem(COMPASS_HISTORY_STORAGE_KEY, JSON.stringify({ 'cities|easy': [9] }));
    const { loadCompassHistory } = freshModule();

    const [first, second] = await Promise.all([loadCompassHistory(), loadCompassHistory()]);

    expect(first).toEqual({ 'cities|easy': [9] });
    expect(second).toBe(first);
    expect(await loadCompassHistory()).toBe(first);
  });

  it('falls back to an empty history when the stored value is unreadable', async () => {
    await AsyncStorage.setItem(COMPASS_HISTORY_STORAGE_KEY, '{oops');
    const { loadCompassHistory } = freshModule();

    expect(await loadCompassHistory()).toEqual({});
  });

  it('keeps working when the device refuses the write', async () => {
    const { loadCompassHistory, recordCompassPlays, hasPlayed } = freshModule();
    await loadCompassHistory();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));

    recordCompassPlays([slot(7)]);

    expect(hasPlayed(await loadCompassHistory(), slot(7))).toBe(true);
    await Promise.resolve();
  });

  it('forgets groups even before anything was loaded', async () => {
    const { forgetCompassGroups, loadCompassHistory } = freshModule();

    forgetCompassGroups(['cities|easy']);

    expect(await loadCompassHistory()).toEqual({});
  });

  it('forgets whole groups and clears everything', async () => {
    const { loadCompassHistory, recordCompassPlays, forgetCompassGroups, clearCompassHistory } = freshModule();
    await loadCompassHistory();
    recordCompassPlays([slot(1), slot(2, 'nature', 'hard')]);

    forgetCompassGroups(['cities|easy']);
    expect(await loadCompassHistory()).toEqual({ 'nature|hard': [2] });

    clearCompassHistory();
    expect(await loadCompassHistory()).toEqual({});
    expect(await stored()).toEqual({});
  });
});
