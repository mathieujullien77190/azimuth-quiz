import { COMPASS_NUMBERING } from '@/data/firestore/numbering';
import { compassFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import type { Language } from '@/i18n';
import type { GameSettings, Place } from '@/types';

import { drawFromGroups, storedTiers } from '@/helpers/groupedDraw';

import { loadCompassCounts } from './compassCounts';
import { loadCompassCursors, saveCompassCursors } from './compassCursors';
import { effectiveDifficulty } from './places';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/**
 * Draws the game's places from Firestore (see `drawFromGroups`): Compass places are numbered inside their
 * group (`compass.category` x `difficulty`, field `n`), sizes in `meta/compassCounts`, cursors per group on
 * the device. The difficulty is filtered by the query itself (it selects the groups); only in English, where a
 * French place is bumped one tier (`effectiveDifficulty`), the tier below is read too, with some slack, and
 * filtered afterwards. Only the host draws (the places are then written into the room), joiners never query.
 *
 * No fallback on the bundled list: rejects when Firestore fails or when fewer than `rounds` matching
 * places exist at all — the host's start flow shows a notice and nothing is started (cursors untouched).
 */
export const fetchRandomPlaces = async (settings: GameSettings, language: Language): Promise<Place[]> => {
  const { categories, difficulty, rounds } = settings;
  const cursors = await loadCompassCursors();
  const counts = await loadCompassCounts();
  return drawFromGroups<Place>({
    numbering: COMPASS_NUMBERING,
    categoryField: 'compass.category',
    numberField: 'n',
    counts,
    cursors,
    saveCursors: saveCompassCursors,
    categories,
    tiers: storedTiers(difficulty, language),
    rounds,
    toItem: (data) => compassFromDoc(data as PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> }),
    keep: (place) => effectiveDifficulty(place, language) === difficulty,
  });
};
