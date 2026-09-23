import { INDICES_CLUE_COSTS, INDICES_CLUE_ORDER, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesClueId, IndicesPlace } from '@/types';

/** Score de la manche : cumul du cout de chaque indice deja choisi. Score bas = bonne manche (on a
 * trouve avec peu/des indices faciles), score haut = mauvaise (beaucoup d'indices chers utilises). */
export const scoreForRevealed = (revealedClueIds: IndicesClueId[]): number =>
  revealedClueIds.reduce((total, clueId) => total + INDICES_CLUE_COSTS[clueId], 0);

/** Pire score possible sur une manche : cout de tous les indices s'il fallait vraiment tous les
 * reveler, y compris plusieurs fois pour ceux qui se devoilent par etapes (emoji : 3 clics,
 * distance : 2, drapeau : autant de couleurs que le pays en a). Penalite appliquee a tout le monde
 * quand personne ne trouve (mauvaise reponse ou abandon) : voir `settle`/`giveUp`. */
export const maxRoundScore = (flagColorCount: number): number =>
  INDICES_CLUE_ORDER.reduce((total, clueId) => {
    const revealCount =
      clueId === 'emoji' ? 3 : clueId === 'flagColors' ? flagColorCount : clueId === 'distance' ? 2 : 1;
    return total + INDICES_CLUE_COSTS[clueId] * revealCount;
  }, 0);

/** Lieu de la manche : tire au sort parmi les lieux de la difficulte choisie (repli sur tout le
 * pool si le filtre est vide, ce qui ne devrait pas arriver avec 446 lieux repartis sur 4 paliers). */
export const randomIndicesPlace = (difficulty: Difficulty): IndicesPlace => {
  const pool = INDICES_PLACES.filter((place) => place.difficulty === difficulty);
  const source = pool.length > 0 ? pool : INDICES_PLACES;
  return source[Math.floor(Math.random() * source.length)];
};

/** Normalise un nom de lieu pour comparaison (mode "je tape la ville") : minuscules, accents et
 * ponctuation retires, espaces multiples reduits. */
export const normalizePlaceGuess = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** Un groupe (mot) de "slots" du recap au-dessus des boutons buzz/abandon : chaque slot est soit
 * une lettre deja revelee, soit `null` (case a dessiner comme un trait, pas encore devoilee). */
export type NameSkeletonSlot = string | null;

/**
 * Decoupe le nom en groupes de slots pour le recap "M _ _ _" au-dessus des boutons buzz/abandon.
 * `groupByWord` separe les mots (indice "Nombre de mots" revele) au lieu d'un seul bloc,
 * `revealFirst` devoile la toute premiere lettre du nom (indice "Premiere lettre" revele).
 * `includeHidden` doit rester false tant qu'aucun indice ne donne la longueur reelle (ni
 * "Lettres" ni "Nombre de mots") : sinon les slots caches laisseraient deviner une longueur
 * jamais payee — dans ce cas seule la lettre effectivement revelee (au plus une) est gardee.
 */
export const nameSkeleton = (
  name: string,
  options: { groupByWord: boolean; revealFirst: boolean; includeHidden: boolean },
): NameSkeletonSlot[][] => {
  const words = options.groupByWord ? name.trim().split(/\s+/) : [name];
  const groups = words.map((word, wordIndex) =>
    [...word.replace(/[^\p{L}]/gu, '')].map((letter, letterIndex): NameSkeletonSlot =>
      options.revealFirst && wordIndex === 0 && letterIndex === 0 ? letter.toUpperCase() : null,
    ),
  );
  if (options.includeHidden) return groups;
  return groups.map((group) => group.filter((slot) => slot !== null)).filter((group) => group.length > 0);
};
