import { CLUES_COUNTS_DOC } from '@/data/firestore/types';
import { createGroupCounts } from '@/helpers/groupCounts';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` and `firestoreCluePlaces.ts`.

const counts = createGroupCounts(CLUES_COUNTS_DOC);

/** The Clues group sizes (`meta/cluesCounts`, see `fetchClueRoundPlaces`), read once and shared. */
export const loadCluesCounts = counts.load;
export const preloadCluesCounts = counts.preload;
export const clearCluesCounts = counts.clear;
