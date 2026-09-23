import { INDICES_CLUE_COSTS, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesClueId, IndicesPlace } from '@/types';

/** Score de la manche : cumul du cout de chaque indice deja choisi. Score bas = bonne manche (on a
 * trouve avec peu/des indices faciles), score haut = mauvaise (beaucoup d'indices chers utilises). */
export const scoreForRevealed = (revealedClueIds: IndicesClueId[]): number =>
  revealedClueIds.reduce((total, clueId) => total + INDICES_CLUE_COSTS[clueId], 0);

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

export const formatRoundProgress = (roundNumber: number, totalRounds: number): string =>
  `${roundNumber} / ${totalRounds}`;
