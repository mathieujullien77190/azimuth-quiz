import Constants from 'expo-constants';
import { collection, doc, increment, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { Platform } from 'react-native';

import { auth, db } from './firebase';
import type { ErrorRecord } from './reportError';

/** An error is good for cleaning after 30 days (`expireAt`: the admin's "Erreurs" page deletes the expired ones). */
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** The day as `firestore.rules` computes it from `request.time` (UTC, no zero padding): the id of the day's quota
 * documents. */
export const dayKey = (date: Date): string => `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;

/**
 * Writes one error and bumps this device's and the global daily counters in the SAME batch: the rules only accept the
 * error when both counters went up by exactly one and stay under their caps (30 a day per device, 1000 a day in all), so
 * nobody can flood the collection. Nothing here goes through the admin's journal or `meta/dataVersion`.
 */
export const writeErrorRecord = async (record: ErrorRecord): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (uid === undefined) return;
  const now = new Date();
  const day = dayKey(now);
  const batch = writeBatch(db);
  batch.set(doc(collection(db, 'errors')), {
    ...record,
    uid,
    platform: Platform.OS,
    version: Constants.expoConfig?.version ?? 'unknown',
    at: serverTimestamp(),
    expireAt: Timestamp.fromMillis(now.getTime() + RETENTION_MS),
  });
  batch.set(doc(db, 'errorQuota', `${uid}_${day}`), { count: increment(1) }, { merge: true });
  batch.set(doc(db, 'errorQuota', `global_${day}`), { count: increment(1) }, { merge: true });
  await batch.commit();
};
