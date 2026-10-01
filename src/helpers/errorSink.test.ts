import { dayKey, writeErrorRecord } from './errorSink';
import type { ErrorRecord } from './reportError';

const mockBatch = { set: jest.fn(), commit: jest.fn(() => Promise.resolve()) };
const mockAuth: { currentUser: { uid: string } | null } = { currentUser: { uid: 'zoe' } };
const mockConstants: { expoConfig: { version: string } | null } = { expoConfig: { version: '9.9.9' } };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, name: string) => ({ collectionName: name })),
  doc: jest.fn((target, ...path: string[]) =>
    'collectionName' in target ? { path: `${target.collectionName}/auto` } : { path: path.join('/') },
  ),
  increment: jest.fn((n: number) => ({ increment: n })),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: { fromMillis: jest.fn((ms: number) => ({ millis: ms })) },
  writeBatch: jest.fn(() => mockBatch),
}));
jest.mock('./firebase', () => ({
  db: {},
  get auth() {
    return mockAuth;
  },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  get default() {
    return mockConstants;
  },
}));

const record: ErrorRecord = {
  action: 'silhouette.revealHint',
  code: 'permission-denied',
  message: 'no',
  room: 'abc',
  kind: 'game',
  repeats: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(new Date('2026-10-02T23:59:00Z'));
  mockAuth.currentUser = { uid: 'zoe' };
  mockConstants.expoConfig = { version: '9.9.9' };
});

afterEach(() => jest.useRealTimers());

describe('dayKey', () => {
  it('is the UTC day without zero padding, as the rules compute it', () => {
    expect(dayKey(new Date('2026-01-05T10:00:00Z'))).toBe('2026-1-5');
    expect(dayKey(new Date('2026-10-02T23:59:00Z'))).toBe('2026-10-2');
  });
});

describe('writeErrorRecord', () => {
  it('writes the error and both daily counters in one batch', async () => {
    await writeErrorRecord(record);
    expect(mockBatch.set).toHaveBeenCalledTimes(3);
    const [[errorRef, error], [ownRef, own, ownOptions], [globalRef, global]] = mockBatch.set.mock.calls;
    expect(errorRef).toEqual({ path: 'errors/auto' });
    expect(error).toEqual({
      ...record,
      uid: 'zoe',
      platform: expect.any(String),
      version: '9.9.9',
      at: 'SERVER_TIMESTAMP',
      expireAt: { millis: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    });
    expect(ownRef).toEqual({ path: 'errorQuota/zoe_2026-10-2' });
    expect(own).toEqual({ count: { increment: 1 } });
    expect(ownOptions).toEqual({ merge: true });
    expect(globalRef).toEqual({ path: 'errorQuota/global_2026-10-2' });
    expect(global).toEqual({ count: { increment: 1 } });
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('says "unknown" when the app version cannot be read', async () => {
    mockConstants.expoConfig = null;
    await writeErrorRecord(record);
    expect(mockBatch.set.mock.calls[0][1].version).toBe('unknown');
  });

  it('writes nothing while nobody is signed in', async () => {
    mockAuth.currentUser = null;
    await writeErrorRecord(record);
    expect(mockBatch.set).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
