import { doc, getDoc } from 'firebase/firestore';

import { COMPASS_COUNTS_DOC, type CompassCounts, type CompassCountsDoc } from '@/data/firestore/types';

import { db } from '@/helpers/firebase';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` and `firestorePlaces.ts`.

/** The Compass group sizes (`meta/compassCounts`, see `fetchRandomPlaces`), read once and shared: the
 * app starts the read at launch (`preloadCompassCounts`), so a game finds it already there. */
let loading: Promise<CompassCounts> | null = null;

/** The group sizes — an absent document reads as no places at all. A failed read is not kept, the next
 * call tries again. Sizes only change when the admin edits places: read again at the next launch. */
export const loadCompassCounts = (): Promise<CompassCounts> => {
  loading ??= getDoc(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id))
    .then((snapshot) => {
      console.log(
        `[firestore] ${COMPASS_COUNTS_DOC.collection}/${COMPASS_COUNTS_DOC.id}: ${snapshot.data() ? 1 : 0} document(s) received`,
        snapshot.data(),
      );
      return ((snapshot.data() ?? { counts: {} }) as CompassCountsDoc).counts;
    })
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
};

/** Starts the read without waiting for it (app launch). A failure here is silent: starting a game
 * reads again and reports it. */
export const preloadCompassCounts = (): void => {
  loadCompassCounts().catch(() => {});
};

/** Forgets the shared read (the next call reads Firestore again). */
export const clearCompassCounts = (): void => {
  loading = null;
};
