import AsyncStorage from '@react-native-async-storage/async-storage';

import { CONTOUR_CURSORS_STORAGE_KEY } from '@/games/contour/constants';

// The module caches in module-level variables: each test gets a fresh copy.
const freshModule = () => {
  let mod!: typeof import('./contourCursors');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules needs a synchronous require, not a dynamic import()
    mod = require('./contourCursors');
  });
  return mod;
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('contourCursors', () => {
  it('starts with no cursor, moves a difficulty group on and clears them, on the device too', async () => {
    const { loadContourCursors, saveContourCursors, clearContourCursors } = freshModule();
    expect(await loadContourCursors()).toEqual({});

    saveContourCursors({ intermediate: 40 });
    expect(await loadContourCursors()).toEqual({ intermediate: 40 });
    expect(JSON.parse((await AsyncStorage.getItem(CONTOUR_CURSORS_STORAGE_KEY))!)).toEqual({ intermediate: 40 });

    clearContourCursors();
    expect(await loadContourCursors()).toEqual({});
  });
});
