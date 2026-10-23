import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { DEV_CODE, DEV_FEEDBACK_COLLECTION } from '@/data';
import type { Difficulty } from '@/types';

import { db } from './client';
import { getLocalUid } from './roomCode';

// Hors du barrel de `helpers/index.ts` : `firebase/firestore` est ESM seul et fait planter Jest.

/** Un avis de difficulte sur un lieu, envoye par un appareil en mode dev (`useDevFeedback`). */
export type DevFeedback = {
  game: 'compass' | 'clues';
  targetType: 'place';
  /** Cle du lieu (`places/{key}`). */
  targetKey: string;
  name: string;
  currentDifficulty: Difficulty;
  suggestedDifficulty: Difficulty;
};

/** Longueur max d'un nom ou d'une cle : les regles refusent plus long. */
const MAX_LENGTH = 80;

/**
 * Ecrit un avis dans `devFeedback`. Les regles exigent le code dev secret (`DEV_CODE`) : c'est la vraie barriere.
 * Hors journal et `meta/dataVersion`.
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
