import { CURSORS_STORAGE_KEY } from '@/games/constants';
import { createGroupCursors, type GroupCursors } from '@/helpers/groupCursors';

/** Position de l'appareil dans chaque groupe de lieux (voir `createGroupCursors`). */
export type Cursors = GroupCursors;

const cursors = createGroupCursors(CURSORS_STORAGE_KEY);

export const loadCursors = cursors.load;
export const saveCursors = cursors.save;
export const clearCursors = cursors.clear;
