import { CLUES_NUMBERING } from '@/data/firestore/numbering';
import { cluesFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import { effectiveDifficulty } from '@/games/compass/helpers/places';
import type { Language } from '@/i18n';
import type { ClueSettings, CluePlace } from '@/types';

import { drawFromGroups, storedTiers } from '@/firebase/groupedDraw';

import { loadCluesCounts } from '../helpers/clueCounts';
import { loadClueCursors, saveClueCursors } from '../helpers/clueCursors';

// Hors barrel de `helpers/index.ts` comme `room.ts` : `firebase/firestore` est ESM seul et fait planter Jest.

/**
 * Tire les lieux depuis Firestore comme Compass (voir `drawFromGroups`) : numerotes par groupe
 * (`clues.category` x `difficulty`, champ `clues.n`), tailles dans `meta/cluesCounts`, curseurs sur l'appareil.
 * Le lieu revient complet (voir `cluesFromDoc`) : une manche ne lit rien d'autre.
 * En anglais un lieu francais monte d'un cran (`effectiveDifficulty`) : on lit aussi le cran du dessous puis on filtre.
 *
 * Aucun repli : rejette si Firestore echoue ou s'il y a moins de lieux que de manches (curseurs intacts).
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
