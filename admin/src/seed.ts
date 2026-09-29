import { doc, writeBatch } from 'firebase/firestore';

import { buildCountryDocs, buildJobDocs, buildPlaceDocs, buildRiddleDocs } from '@/data/firestore/build';
import { COLLECTIONS, DATA_VERSION_DOC } from '@/data/firestore/types';

import { db } from './firebase';

const BATCH_SIZE = 400;

/**
 * One-off first import of the bundled JSON into Firestore, done with the admin's own Google session
 * (no service account needed — `firestore.rules` lets the admin write). Only offered by `AuthGate`
 * while the `places` collection is empty, so it can never overwrite curated data. `onProgress`
 * receives (written, total).
 */
export const seedFirestore = async (onProgress: (written: number, total: number) => void): Promise<void> => {
  const entries: [string, string, object][] = [
    ...Object.entries(buildPlaceDocs()).map(([id, value]): [string, string, object] => [COLLECTIONS.places, id, value]),
    ...Object.entries(buildCountryDocs()).map(([id, value]): [string, string, object] => [COLLECTIONS.countries, id, value]),
    ...Object.entries(buildRiddleDocs()).map(([id, value]): [string, string, object] => [COLLECTIONS.charadeRiddles, id, value]),
    ...Object.entries(buildJobDocs()).map(([id, value]): [string, string, object] => [COLLECTIONS.personalityJobs, id, value]),
  ];
  let written = 0;
  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const [collection, id, value] of entries.slice(start, start + BATCH_SIZE)) batch.set(doc(db, collection, id), value);
    await batch.commit();
    written += Math.min(BATCH_SIZE, entries.length - start);
    onProgress(written, entries.length);
  }
  // Written last: its presence means the import went through completely.
  const version = writeBatch(db);
  version.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), { version: 1, updatedAt: Date.now() });
  await version.commit();
};
