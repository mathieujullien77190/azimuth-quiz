import { COMPASS_CURSORS_STORAGE_KEY } from '@/games/compass/constants';
import { createGroupCursors, type GroupCursors } from '@/helpers/groupCursors';

/** Position de l'appareil dans chaque groupe Compass (voir `createGroupCursors`). */
export type CompassCursors = GroupCursors;

const cursors = createGroupCursors(COMPASS_CURSORS_STORAGE_KEY);

export const loadCompassCursors = cursors.load;
export const saveCompassCursors = cursors.save;
export const clearCompassCursors = cursors.clear;
