import { CONTOUR_CURSORS_STORAGE_KEY } from '@/games/contour/constants';
import { createGroupCursors } from '@/helpers/groupCursors';

/** Where this device is in every Silhouette group (one per `difficulty`, see `createGroupCursors`). */
const cursors = createGroupCursors(CONTOUR_CURSORS_STORAGE_KEY);

export const loadContourCursors = cursors.load;
export const saveContourCursors = cursors.save;
export const clearContourCursors = cursors.clear;
