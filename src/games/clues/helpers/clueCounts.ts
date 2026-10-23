import { CLUES_COUNTS_DOC } from '@/data/firestore/types';
import { createGroupCounts } from '@/firebase/groupCounts';

// Hors barrel de `helpers/index.ts`, comme `room.ts` et `firestoreCluePlaces.ts`.

const counts = createGroupCounts(CLUES_COUNTS_DOC);

/** Tailles des groupes Indices (`meta/cluesCounts`, voir `fetchClueRoundPlaces`), lues une fois et partagees. */
export const loadCluesCounts = counts.load;
export const preloadCluesCounts = counts.preload;
export const clearCluesCounts = counts.clear;
