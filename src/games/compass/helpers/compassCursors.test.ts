import AsyncStorage from '@react-native-async-storage/async-storage';

import { COMPASS_CURSORS_STORAGE_KEY } from '@/games/compass/constants';

// The module caches in module-level variables: each test gets a fresh copy (same approach as `clueHistory.test.ts`).
const freshModule = () => {
  let mod!: typeof import('./compassCursors');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules needs a synchronous require, not a dynamic import()
    mod = require('./compassCursors');
  });
  return mod;
};

const stored = async () => JSON.parse((await AsyncStorage.getItem(COMPASS_CURSORS_STORAGE_KEY)) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('compassCursors', () => {
  it('starts with no cursor', async () => {
    const { loadCompassCursors } = freshModule();

    expect(await loadCompassCursors()).toEqual({});
  });

  it('names a group by category and difficulty', () => {
    const { groupKey } = freshModule();

    expect(groupKey({ category: 'nature', difficulty: 'hard' })).toBe('nature|hard');
  });

  it('moves some groups on, keeps the others, in memory and on the device', async () => {
    const { loadCompassCursors, saveCompassCursors } = freshModule();
    await loadCompassCursors();

    saveCompassCursors({ 'cities|easy': 5, 'nature|hard': 2 });
    saveCompassCursors({ 'cities|easy': 9 });

    expect(await loadCompassCursors()).toEqual({ 'cities|easy': 9, 'nature|hard': 2 });
    expect(await stored()).toEqual({ 'cities|easy': 9, 'nature|hard': 2 });
  });

  it('saves before anything was loaded', async () => {
    const { saveCompassCursors, loadCompassCursors } = freshModule();

    saveCompassCursors({ 'cities|easy': 1 });

    expect(await loadCompassCursors()).toEqual({ 'cities|easy': 1 });
  });

  it('loads saved cursors, sharing one read between concurrent callers', async () => {
    await AsyncStorage.setItem(COMPASS_CURSORS_STORAGE_KEY, JSON.stringify({ 'cities|easy': 9 }));
    const { loadCompassCursors } = freshModule();

    const [first, second] = await Promise.all([loadCompassCursors(), loadCompassCursors()]);

    expect(first).toEqual({ 'cities|easy': 9 });
    expect(second).toBe(first);
    expect(await loadCompassCursors()).toBe(first);
  });

  it('falls back to no cursor when the stored value is unreadable', async () => {
    await AsyncStorage.setItem(COMPASS_CURSORS_STORAGE_KEY, '{oops');
    const { loadCompassCursors } = freshModule();

    expect(await loadCompassCursors()).toEqual({});
  });

  it('keeps working when the device refuses the write', async () => {
    const { loadCompassCursors, saveCompassCursors } = freshModule();
    await loadCompassCursors();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));

    saveCompassCursors({ 'cities|easy': 7 });

    expect(await loadCompassCursors()).toEqual({ 'cities|easy': 7 });
    await Promise.resolve();
  });

  it('clears everything', async () => {
    const { loadCompassCursors, saveCompassCursors, clearCompassCursors } = freshModule();
    await loadCompassCursors();
    saveCompassCursors({ 'cities|easy': 3 });

    clearCompassCursors();

    expect(await loadCompassCursors()).toEqual({});
    expect(await stored()).toEqual({});
  });
});
