import { COMPASS_COUNTS_DOC } from '@/data/firestore/types';
import { createGroupCounts } from '@/helpers/groupCounts';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` and `firestorePlaces.ts`.

const counts = createGroupCounts(COMPASS_COUNTS_DOC);

/** The Compass group sizes (`meta/compassCounts`, see `fetchRandomPlaces`), read once and shared. */
export const loadCompassCounts = counts.load;
export const preloadCompassCounts = counts.preload;
export const clearCompassCounts = counts.clear;
