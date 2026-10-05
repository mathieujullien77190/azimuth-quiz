import { addDoc } from 'firebase/firestore';

import { DEV_CODE } from '@/data';

import { sendDevFeedback } from './devFeedback';
import { getLocalUid } from './roomCode';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn((_db, name: string) => ({ collectionName: name })),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));
jest.mock('./firebase', () => ({ db: {} }));
jest.mock('./roomCode', () => ({ getLocalUid: jest.fn(() => Promise.resolve('zoe')) }));

const feedback = {
  game: 'compass',
  targetType: 'place',
  targetKey: 'vic',
  name: 'Chutes Victoria',
  currentDifficulty: 'intermediate',
  suggestedDifficulty: 'hard',
} as const;

describe('sendDevFeedback', () => {
  it('writes the opinion in devFeedback with the dev code, the uid and the server time', async () => {
    await sendDevFeedback(feedback);
    expect(getLocalUid).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith(
      { collectionName: 'devFeedback' },
      { ...feedback, devCode: DEV_CODE, uid: 'zoe', at: 'SERVER_TIMESTAMP' },
    );
  });

  it('cuts a name and a key to what the rules accept', async () => {
    await sendDevFeedback({ ...feedback, name: 'x'.repeat(200), targetKey: 'k'.repeat(200) });
    const written = jest.mocked(addDoc).mock.calls.at(-1)![1] as { name: string; targetKey: string };
    expect(written.name).toHaveLength(80);
    expect(written.targetKey).toHaveLength(80);
  });
});
