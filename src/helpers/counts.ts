import { COUNTS_DOC } from '@/firebase/types';
import { createGroupCounts } from '@/firebase/groupCounts';

// Hors barrel, comme `room.ts` et `firestorePlaces.ts`.

const counts = createGroupCounts(COUNTS_DOC);

/** Tailles des groupes de lieux (`meta/compassCounts`, voir `fetchRandomPlaces`), lues une fois et partagees. */
export const loadCounts = counts.load;
export const preloadCounts = counts.preload;
export const clearCounts = counts.clear;
