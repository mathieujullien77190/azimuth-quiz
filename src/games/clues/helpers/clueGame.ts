import { CLUE_ORDER } from '@/games/clues/constants';
import { HYPHEN_SLOT, type NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import { personalityFor } from '@/games/clues/helpers/personality';
import { wordplayFor } from '@/games/clues/helpers/wordplay';
import type { ClueCategory, ClueId, CluePlace } from '@/types';

/** Indices en 2 clics (palier/symbole/jour-nuit puis valeur exacte) ; `letter` : 1re lettre seule puis toutes. `wordplay` : un seul clic. */
const TWO_STAGE_CLUE_IDS = new Set(['distance', 'globe', 'elevation', 'population', 'currency', 'localTime', 'letter']);
/** Indices en 3 clics. */
const THREE_STAGE_CLUE_IDS = new Set(['emoji', 'flagColors']);

/** Un indice `citiesFr` ne varie pas sur ceux-ci (meme fuseau, meme drapeau/devise/indicatif...) : retires de `cluesFor` pour cette categorie seulement. */
const CITIES_FR_EXCLUDED_CLUE_IDS = new Set<ClueId>(['localTime', 'isCapital', 'flagColors', 'currency', 'phoneCode']);

/** Categorie Indices de `place` : capitale, puis ville francaise, puis ville simple (voir `CluePlace.category`). */
export const placeCategory = (place: Pick<CluePlace, 'category'>): ClueCategory => place.category;

/**
 * Ids d'indices offerts pour `place`, dans l'ordre de `CLUE_ORDER` : retire ceux d'une ville `citiesFr`
 * et `personality`/`wordplay` sans curation (jamais de carte vide).
 */
export const cluesFor = (place: CluePlace): ClueId[] => {
  const categoryIds =
    placeCategory(place) === 'citiesFr' ? CLUE_ORDER.filter((id) => !CITIES_FR_EXCLUDED_CLUE_IDS.has(id)) : CLUE_ORDER;
  return categoryIds.filter((id) => {
    if (id === 'personality') return personalityFor(place) !== null;
    if (id === 'wordplay') return wordplayFor(place) !== null;
    return true;
  });
};

/** Nombre de clics pour tout devoiler d'un `clueId`. */
const clueStageCount = (clueId: ClueId): number => {
  if (THREE_STAGE_CLUE_IDS.has(clueId)) return 3;
  if (TWO_STAGE_CLUE_IDS.has(clueId)) return 2;
  return 1;
};

/** Nombre total d'indices possibles pour `place` (etapes comptees), base de `maxScoreForRound`. */
export const totalRevealCount = (place: CluePlace): number =>
  cluesFor(place).reduce((total, clueId) => total + clueStageCount(clueId), 0);

/** Score de depart : `totalReveals` arrondi a la dizaine superieure (ex. 26 -> 30), moins 1 par indice choisi. */
export const maxScoreForRound = (totalReveals: number): number => Math.ceil(totalReveals / 10) * 10;

/** Score restant de la manche, depuis `revealedClueIds` et `place` seuls : meme calcul pour l'hote en ligne et le jeu local.
 * `vowels` sort du decompte lineaire et ramene la manche a 1 s'il restait plus (voir `types/index.ts`). */
export const remainingScore = (revealedClueIds: ClueId[], place: CluePlace): number => {
  const maxScore = maxScoreForRound(totalRevealCount(place));
  const vowelsRevealed = revealedClueIds.includes('vowels');
  const countdownRemaining = maxScore - revealedClueIds.filter((id) => id !== 'vowels').length;
  return vowelsRevealed ? Math.min(countdownRemaining, 1) : countdownRemaining;
};

/** Normalise un nom pour la comparaison : minuscules, sans accents ni espaces ni ponctuation ("N'Djamena" = "Ndjamena"). */
export const normalizePlaceGuess = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');

/** Nombre de cases-lettres d'un squelette (separateurs exclus) : plafond de saisie, voir `overlayTypedLetters`. */
export const skeletonLetterCount = (groups: NameSkeletonSlot[][]): number =>
  groups.reduce((total, group) => total + group.filter((slot) => slot !== HYPHEN_SLOT).length, 0);

/** Remplit le squelette avec la saisie une fois la forme connue (3e clic de `letter`) ; la saisie est consommee
 * par position sur toutes les cases, devoilees ou non : on tape le nom entier. */
export const overlayTypedLetters = (groups: NameSkeletonSlot[][], typed: string): NameSkeletonSlot[][] => {
  const typedLetters = [...typed.replace(/[^\p{L}]/gu, '')];
  let index = 0;
  return groups.map((group) =>
    group.map((slot) => {
      if (slot === HYPHEN_SLOT) return slot;
      const typedLetter = typedLetters[index];
      index += 1;
      return typedLetter !== undefined ? typedLetter.toUpperCase() : slot;
    }),
  );
};

/** Transforme une saisie brute en groupes de cases (voir l'implementation partagee) tant que la forme reelle est inconnue. */
export { typedSkeleton } from '@/components/TypedAnswer/helpers';
