import { doc, writeBatch } from 'firebase/firestore';

import { legacyKeyToPlaceId } from '@/data/firestore/build';
import { COLLECTIONS, DATA_VERSION_DOC } from '@/data/firestore/types';

import { data } from './data';
import { db } from './firebase';

/** Two operations (copy + delete) per place, so 100 places stay well under the 500-op batch limit. */
const PLACES_PER_BATCH = 100;

/** Places still stored under a legacy 3-letter key (`par`), with the readable id they move to. */
export const pendingPlaceMoves = (): [oldKey: string, newId: string][] => {
  const ids = legacyKeyToPlaceId();
  return Object.keys(data().places)
    .filter((key) => key in ids)
    .map((key): [string, string] => [key, ids[key]]);
};

/**
 * One-off move of the already-imported `places/{3-letter key}` documents to `places/{fr-paris}`. Each
 * document is copied as it currently is (admin edits included) then the old one is deleted, in
 * batches; safe to run again after an interruption (a place already moved is no longer pending).
 * `onProgress` receives (moved, total).
 */
export const migratePlaceIds = async (onProgress: (moved: number, total: number) => void): Promise<void> => {
  const moves = pendingPlaceMoves();
  let moved = 0;
  for (let start = 0; start < moves.length; start += PLACES_PER_BATCH) {
    const batch = writeBatch(db);
    for (const [oldKey, newId] of moves.slice(start, start + PLACES_PER_BATCH)) {
      batch.set(doc(db, COLLECTIONS.places, newId), data().places[oldKey]);
      batch.delete(doc(db, COLLECTIONS.places, oldKey));
    }
    await batch.commit();
    moved += Math.min(PLACES_PER_BATCH, moves.length - start);
    onProgress(moved, moves.length);
  }
  const version = writeBatch(db);
  version.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), { updatedAt: Date.now() }, { merge: true });
  await version.commit();
};
