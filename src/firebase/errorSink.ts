import Constants from 'expo-constants';
import { collection, doc, increment, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { Platform } from 'react-native';

import { auth, db } from './client';
import { ERROR_QUOTA_COLLECTION, ERROR_RETENTION_MS, ERRORS_COLLECTION } from './constants';
import type { ErrorRecord } from '@/helpers/errors';

/** Le jour tel que `firestore.rules` le calcule (UTC, sans zero de tete) : id des documents de quota. */
export const dayKey = (date: Date): string => `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;

/**
 * Ecrit une erreur et incremente les compteurs du jour (appareil et global) dans le MEME lot : les regles
 * exigent +1 exact sous les plafonds (30/appareil, 1000 au total). Hors journal et `meta/dataVersion`.
 */
export const writeErrorRecord = async (record: ErrorRecord): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (uid === undefined) return;
  const now = new Date();
  const day = dayKey(now);
  const batch = writeBatch(db);
  batch.set(doc(collection(db, ERRORS_COLLECTION)), {
    ...record,
    uid,
    platform: Platform.OS,
    version: Constants.expoConfig?.version ?? 'unknown',
    at: serverTimestamp(),
    expireAt: Timestamp.fromMillis(now.getTime() + ERROR_RETENTION_MS),
  });
  batch.set(doc(db, ERROR_QUOTA_COLLECTION, `${uid}_${day}`), { count: increment(1) }, { merge: true });
  batch.set(doc(db, ERROR_QUOTA_COLLECTION, `global_${day}`), { count: increment(1) }, { merge: true });
  await batch.commit();
};
