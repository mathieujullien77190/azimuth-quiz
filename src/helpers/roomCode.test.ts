import { signInAnonymously } from 'firebase/auth';

import { auth } from '@/helpers/firebase';

import { generateRoomCode, getLocalUid, isValidRoomCode } from './roomCode';

jest.mock('firebase/auth', () => ({ signInAnonymously: jest.fn() }));
jest.mock('@/helpers/firebase', () => ({ auth: { currentUser: null } }));

const mockAuth = auth as unknown as { currentUser: { uid: string } | null };

describe('isValidRoomCode', () => {
  it('accepts 4 consonant+vowel syllables', () => {
    expect(isValidRoomCode('tarabota')).toBe(true);
    expect(isValidRoomCode('badokifa')).toBe(true);
  });

  it('rejects the wrong length, letters outside the alphabet and the wrong shape', () => {
    expect(isValidRoomCode('')).toBe(false);
    expect(isValidRoomCode('badoki')).toBe(false);
    expect(isValidRoomCode('badokifabd')).toBe(false);
    expect(isValidRoomCode('badekifa')).toBe(false);
    expect(isValidRoomCode('abadokif')).toBe(false);
    expect(isValidRoomCode('BADOKIFA')).toBe(false);
  });
});

describe('generateRoomCode', () => {
  it('always yields a code that passes the validator', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isValidRoomCode(generateRoomCode())).toBe(true);
    }
  });
});

describe('getLocalUid', () => {
  beforeEach(() => {
    mockAuth.currentUser = null;
    (signInAnonymously as jest.Mock).mockReset();
  });

  it('reuses the current anonymous session without signing in again', async () => {
    mockAuth.currentUser = { uid: 'existing' };
    await expect(getLocalUid()).resolves.toBe('existing');
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously when there is no session yet', async () => {
    (signInAnonymously as jest.Mock).mockResolvedValue({ user: { uid: 'fresh' } });
    await expect(getLocalUid()).resolves.toBe('fresh');
    expect(signInAnonymously).toHaveBeenCalledWith(auth);
  });
});
