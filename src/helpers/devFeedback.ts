import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { DEV_CODE, DEV_FEEDBACK_COLLECTION } from '@/data';
import type { Difficulty } from '@/types';

import { db } from './firebase';
import { getLocalUid } from './roomCode';

// Not re-exported from `helpers/index.ts`'s barrel, like `room.ts`: `firebase/firestore` is ESM-only and crashes Jest for
// every test that imports the barrel for something unrelated.

/** One opinion about how hard a place is, given by a device in dev mode (see `useDevFeedback`). */
export type DevFeedback = {
  game: 'compass' | 'clues';
  targetType: 'place';
  /** The place's key (`places/{key}`). */
  targetKey: string;
  name: string;
  /** What the data says now. */
  currentDifficulty: Difficulty;
  /** What the player thinks. */
  suggestedDifficulty: Difficulty;
};

/** The longest a name or key may be: the rules refuse longer strings. */
const MAX_LENGTH = 80;

/**
 * Writes one opinion in `devFeedback`. The collection's rules only accept it with the secret dev code in the document
 * (`DEV_CODE`): the real gate, the setting that turns the mode on is only a convenience. Read, and cleaned, by the admin's
 * "Avis difficulté" page; nothing here goes through the journal or `meta/dataVersion`.
 */
export const sendDevFeedback = async (feedback: DevFeedback): Promise<void> => {
  const uid = await getLocalUid();
  await addDoc(collection(db, DEV_FEEDBACK_COLLECTION), {
    ...feedback,
    targetKey: feedback.targetKey.slice(0, MAX_LENGTH),
    name: feedback.name.slice(0, MAX_LENGTH),
    devCode: DEV_CODE,
    uid,
    at: serverTimestamp(),
  });
};
