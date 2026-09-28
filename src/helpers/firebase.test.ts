import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { auth, db } from './firebase';

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({ name: 'app' })) }));
jest.mock('firebase/auth', () => ({ getAuth: jest.fn(() => ({ kind: 'auth' })) }));
jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn(() => ({ kind: 'db' })) }));

describe('firebase', () => {
  it('initializes the app once and exposes its Firestore and Auth instances', () => {
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getFirestore).toHaveBeenCalledWith({ name: 'app' });
    expect(getAuth).toHaveBeenCalledWith({ name: 'app' });
    expect(db).toEqual({ kind: 'db' });
    expect(auth).toEqual({ kind: 'auth' });
  });

  it('reads its config from the public Expo env vars', () => {
    const config = (jest.mocked(initializeApp).mock.calls as unknown[][])[0][0] as Record<string, unknown>;
    expect(Object.keys(config)).toEqual(
      expect.arrayContaining(['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']),
    );
  });
});
