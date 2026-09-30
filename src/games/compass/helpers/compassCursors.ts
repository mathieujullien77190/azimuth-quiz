import type { Slot } from '@/data/firestore/numbering';
import { COMPASS_CURSORS_STORAGE_KEY } from '@/games/compass/constants';
import { createGroupCursors, type GroupCursors } from '@/helpers/groupCursors';

/** Where this device is in every Compass group (see `createGroupCursors`). */
export type CompassCursors = GroupCursors;

export const groupKey = ({ category, difficulty }: Pick<Slot, 'category' | 'difficulty'>): string =>
  `${category}|${difficulty}`;

const cursors = createGroupCursors(COMPASS_CURSORS_STORAGE_KEY);

export const loadCompassCursors = cursors.load;
export const saveCompassCursors = cursors.save;
export const clearCompassCursors = cursors.clear;
