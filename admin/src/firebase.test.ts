import { describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const app = { name: 'app' };
  const auth = { name: 'auth' };
  const db = { name: 'db' };
  // Recorded here: `clearMocks` wipes `vi.fn()` calls before each test, and the module runs once at import.
  const calls = { app: [] as unknown[], auth: [] as unknown[], db: [] as unknown[][] };
  return {
    app,
    auth,
    db,
    calls,
    initializeApp: (config: unknown) => (calls.app.push(config), app),
    getAuth: (given: unknown) => (calls.auth.push(given), auth),
    initializeFirestore: (...args: unknown[]) => (calls.db.push(args), db),
  };
});

vi.mock('firebase/app', () => ({ initializeApp: h.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: h.getAuth }));
vi.mock('firebase/firestore', () => ({ initializeFirestore: h.initializeFirestore }));

import { ADMIN_EMAILS, auth, db } from './firebase';

describe('firebase', () => {
  it('initializes the app once with the project config of the environment', () => {
    expect(h.calls.app).toHaveLength(1);
    expect(Object.keys(h.calls.app[0] as object).sort()).toEqual([
      'apiKey',
      'appId',
      'authDomain',
      'messagingSenderId',
      'projectId',
      'storageBucket',
    ]);
  });

  it('exports the auth and a Firestore that ignores undefined properties', () => {
    expect(auth).toBe(h.auth);
    expect(db).toBe(h.db);
    expect(h.calls.auth).toEqual([h.app]);
    expect(h.calls.db).toEqual([[h.app, { ignoreUndefinedProperties: true }]]);
  });

  it('lists the admin accounts', () => {
    expect(ADMIN_EMAILS).toEqual(['mathieu.jullien77190@gmail.com', 'douchin.floran@gmail.com']);
  });
});
