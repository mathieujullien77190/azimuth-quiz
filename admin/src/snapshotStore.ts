const DB_NAME = 'azimuth-admin';
const STORE = 'kv';
const KEY = 'snapshot';

const open = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const run = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

/** The admin's local copy of the Firestore data (IndexedDB: too big for localStorage). Both calls
 * swallow failures (private window, blocked storage): the admin then just reads Firestore every time. */
export const readSnapshot = async <T>(): Promise<T | null> => {
  try {
    return ((await run('readonly', (store) => store.get(KEY))) as T | undefined) ?? null;
  } catch {
    return null;
  }
};

export const writeSnapshot = async (value: unknown): Promise<void> => {
  try {
    await run('readwrite', (store) => store.put(value, KEY));
  } catch {
    // Storage unavailable: nothing to keep, the next load reads Firestore again.
  }
};
