import { CLUE_CURSORS_STORAGE_KEY } from '@/games/clues/constants';
import { createGroupCursors } from '@/helpers/groupCursors';

/** Position de l'appareil dans chaque groupe Indices (`clues.category` x `difficulty`, voir `createGroupCursors`). */
const cursors = createGroupCursors(CLUE_CURSORS_STORAGE_KEY);

export const loadClueCursors = cursors.load;
export const saveClueCursors = cursors.save;
export const clearClueCursors = cursors.clear;
