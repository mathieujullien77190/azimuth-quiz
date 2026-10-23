import { COMPASS_NUMBERING } from '@/data/firestore/numbering';
import { compassFromDoc } from '@/data/firestore/read';
import type { PlaceDoc } from '@/data/firestore/types';
import type { Language } from '@/i18n';
import type { GameSettings, Place } from '@/types';

import { drawFromGroups, storedTiers } from '@/firebase/groupedDraw';

import { loadCompassCounts } from '../helpers/compassCounts';
import { loadCompassCursors, saveCompassCursors } from '../helpers/compassCursors';
import { effectiveDifficulty } from '../helpers/places';

// Hors barrel de `helpers/index.ts` comme `room.ts` : `firebase/firestore` est ESM seul et plante Jest.

/**
 * Tire les lieux de la partie dans Firestore (voir `drawFromGroups`) : numerotes par groupe
 * (`compass.category` x `difficulty`, champ `n`), tailles dans `meta/compassCounts`, curseurs par groupe
 * sur l'appareil. En anglais seulement, un lieu francais est releve d'un cran (`effectiveDifficulty`) : on
 * lit aussi le palier du dessous et on refiltre. Seul l'hote tire. Pas de repli : rejette si Firestore
 * echoue ou s'il y a moins de `rounds` lieux.
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
    toItem: (data, id) => compassFromDoc(data as PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> }, id),
    keep: (place) => effectiveDifficulty(place, language) === difficulty,
  });
};
