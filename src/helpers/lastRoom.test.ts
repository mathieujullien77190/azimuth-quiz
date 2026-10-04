import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadLastJoinedRoom, saveLastJoinedRoom } from './lastRoom';

beforeEach(() => AsyncStorage.clear());

describe('last joined room', () => {
  it('gives back the saved code, or null when there is none', async () => {
    await expect(loadLastJoinedRoom()).resolves.toBeNull();
    await saveLastJoinedRoom('tabofuna');
    await expect(loadLastJoinedRoom()).resolves.toBe('tabofuna');
  });

  it('swallows storage failures', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('boom'));
    await expect(loadLastJoinedRoom()).resolves.toBeNull();
    await expect(saveLastJoinedRoom('tabofuna')).resolves.toBeUndefined();
  });
});
