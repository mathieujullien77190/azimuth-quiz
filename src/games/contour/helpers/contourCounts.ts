import { CONTOUR_COUNTS_DOC, type ContourCounts } from '@/data/firestore/types';
import { createGroupCounts } from '@/helpers/groupCounts';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` and `firestoreContours.ts`.

const counts = createGroupCounts<ContourCounts>(CONTOUR_COUNTS_DOC);

/** The Silhouette group sizes (`meta/contourCounts`, see `fetchContourRoundCodes`), read once and shared. */
export const loadContourCounts = counts.load;
export const preloadContourCounts = counts.preload;
export const clearContourCounts = counts.clear;
