import { COMPASS_COUNTS_DOC } from '@/data/firestore/types';
import { createGroupCounts } from '@/firebase/groupCounts';

// Hors barrel, comme `room.ts` et `firestorePlaces.ts`.

const counts = createGroupCounts(COMPASS_COUNTS_DOC);

/** Tailles des groupes Compass (`meta/compassCounts`, voir `fetchRandomPlaces`), lues une fois et partagees. */
export const loadCompassCounts = counts.load;
export const preloadCompassCounts = counts.preload;
export const clearCompassCounts = counts.clear;
