import { CLUES_NUMBERING } from '@/data/firestore/numbering';
import { cluesFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import { effectiveDifficulty } from '@/games/compass/helpers/places';
import type { Language } from '@/i18n';
import type { ClueSettings, CluePlace } from '@/types';

import { drawFromGroups, storedTiers } from '@/helpers/groupedDraw';

import { loadCluesCounts } from './clueCounts';
import { loadClueCursors, saveClueCursors } from './clueCursors';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/**
 * Draws the game's places from Firestore, the same way Compass does (see `drawFromGroups`): Clues places are
 * numbered inside their group (`clues.category` x `difficulty`, field `clues.n`), sizes in `meta/cluesCounts`,
 * cursors per group on the device, the selected categories sharing the rounds as evenly as possible. A place
 * comes back complete (country, personality, wordplay — see `cluesFromDoc`): a round reads nothing
 * else, and the host writes it into the room for the joiners. In English a French place is bumped one tier
 * (`effectiveDifficulty`), so the tier below is read too and filtered afterwards.
 *
 * No fallback on the bundled list: rejects when Firestore fails or when fewer than `rounds` matching
 * places exist at all — the host's start flow shows a notice and nothing is started (cursors untouched).
 */
export const fetchClueRoundPlaces = async (settings: ClueSettings, language: Language): Promise<CluePlace[]> => {
  const { categories, difficulty, rounds } = settings;
  const cursors = await loadClueCursors();
  const counts = await loadCluesCounts();
  return drawFromGroups<CluePlace>({
    numbering: CLUES_NUMBERING,
    categoryField: 'clues.category',
    numberField: 'clues.n',
    counts,
    cursors,
    saveCursors: saveClueCursors,
    categories,
    tiers: storedTiers(difficulty, language),
    rounds,
    toItem: (data, id) => cluesFromDoc(id, data as PlaceDoc & { clues: NonNullable<PlaceDoc['clues']> }),
    keep: (place) => effectiveDifficulty(place, language) === difficulty,
  });
};
