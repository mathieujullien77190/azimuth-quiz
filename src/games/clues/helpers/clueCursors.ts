import { CLUE_CURSORS_STORAGE_KEY } from '@/games/clues/constants';
import { createGroupCursors } from '@/helpers/groupCursors';

/** Where this device is in every Clues group (`clues.category` x `difficulty`, see `createGroupCursors`). */
const cursors = createGroupCursors(CLUE_CURSORS_STORAGE_KEY);

export const loadClueCursors = cursors.load;
export const saveClueCursors = cursors.save;
export const clearClueCursors = cursors.clear;
