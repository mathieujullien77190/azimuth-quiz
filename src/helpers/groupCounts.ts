import { reporting } from './reportError';
import { doc, getDoc } from 'firebase/firestore';

import type { CompassCounts } from '@/data/firestore/types';

import { db } from './firebase';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/**
 * Loader of one game's group sizes (`meta/compassCounts`, `meta/cluesCounts`): read once and shared, the app
 * starts the read at launch (`preload`) so a game finds it already there. An absent document reads as no
 * places at all. A failed read is not kept, the next call tries again. Sizes only change when the admin edits
 * places: read again at the next launch.
 */
export const createGroupCounts = <C = CompassCounts>(source: { collection: string; id: string }) => {
  let loading: Promise<C> | null = null;

  const load = (): Promise<C> => {
    loading ??= getDoc(doc(db, source.collection, source.id))
      .then((snapshot) => ((snapshot.data() ?? { counts: {} }) as { counts: C }).counts)
      .catch((error: unknown) => {
        loading = null;
        throw error;
      });
    return loading;
  };

  return {
    load,
    /** Starts the read without waiting for it (app launch). A failure here is silent: starting a game
     * reads again and reports it. */
    preload: (): void => {
      load().catch(reporting('draw.preloadCounts', { kind: 'background' }));
    },
    /** Forgets the shared read (the next call reads Firestore again). */
    clear: (): void => {
      loading = null;
    },
  };
};
