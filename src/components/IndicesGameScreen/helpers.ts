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

export const formatRoundProgress = (roundNumber: number, totalRounds: number): string =>
  `${roundNumber} / ${totalRounds}`;
