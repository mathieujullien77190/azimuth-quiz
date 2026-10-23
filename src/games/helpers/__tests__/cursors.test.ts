import AsyncStorage from '@react-native-async-storage/async-storage';

import { CURSORS_STORAGE_KEY } from '@/games/constants';

// Le module cache dans des variables : chaque test en a une copie neuve.
const freshModule = () => {
  let mod!: typeof import('../cursors');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules exige un require synchrone, pas un import() dynamique
    mod = require('../cursors');
  });
  return mod;
};

const stored = async () => JSON.parse((await AsyncStorage.getItem(CURSORS_STORAGE_KEY)) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('cursors', () => {
  it('starts with no cursor', async () => {
    const { loadCursors } = freshModule();

    expect(await loadCursors()).toEqual({});
  });

  it('moves some groups on, keeps the others, in memory and on the device', async () => {
    const { loadCursors, saveCursors } = freshModule();
    await loadCursors();

    saveCursors({ 'cities|easy': 5, 'nature|hard': 2 });
    saveCursors({ 'cities|easy': 9 });

    expect(await loadCursors()).toEqual({ 'cities|easy': 9, 'nature|hard': 2 });
    expect(await stored()).toEqual({ 'cities|easy': 9, 'nature|hard': 2 });
  });

  it('saves before anything was loaded', async () => {
    const { saveCursors, loadCursors } = freshModule();

    saveCursors({ 'cities|easy': 1 });

    expect(await loadCursors()).toEqual({ 'cities|easy': 1 });
  });

  it('loads saved cursors, sharing one read between concurrent callers', async () => {
    await AsyncStorage.setItem(CURSORS_STORAGE_KEY, JSON.stringify({ 'cities|easy': 9 }));
    const { loadCursors } = freshModule();

    const [first, second] = await Promise.all([loadCursors(), loadCursors()]);

    expect(first).toEqual({ 'cities|easy': 9 });
    expect(second).toBe(first);
    expect(await loadCursors()).toBe(first);
  });

  it('falls back to no cursor when the stored value is unreadable', async () => {
    await AsyncStorage.setItem(CURSORS_STORAGE_KEY, '{oops');
    const { loadCursors } = freshModule();

    expect(await loadCursors()).toEqual({});
  });

  it('keeps working when the device refuses the write', async () => {
    const { loadCursors, saveCursors } = freshModule();
    await loadCursors();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));

    saveCursors({ 'cities|easy': 7 });

    expect(await loadCursors()).toEqual({ 'cities|easy': 7 });
    await Promise.resolve();
  });

  it('clears everything', async () => {
    const { loadCursors, saveCursors, clearCursors } = freshModule();
    await loadCursors();
    saveCursors({ 'cities|easy': 3 });

    clearCursors();

    expect(await loadCursors()).toEqual({});
    expect(await stored()).toEqual({});
  });
});
