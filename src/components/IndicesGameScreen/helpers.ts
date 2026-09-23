import { INDICES_CLUE_ORDER, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesPlace } from '@/types';

/** Nombre total d'indices possibles sur une manche si on les prenait tous, y compris plusieurs
 * fois pour ceux qui se devoilent par etapes (emoji : 3 clics, distance : 2, drapeau : autant de
 * couleurs que le pays en a) — sert de base a `maxScoreForRound`. */
export const totalRevealCount = (flagColorCount: number): number =>
  INDICES_CLUE_ORDER.reduce((total, clueId) => {
    const count = clueId === 'emoji' ? 3 : clueId === 'flagColors' ? flagColorCount : clueId === 'distance' ? 2 : 1;
    return total + count;
  }, 0);

/** Score de depart de la manche : `totalReveals` arrondi a la dizaine superieure (ex. 26 indices
 * possibles -> 30), un chiffre rond plutot que de dependre du detail des indices actuels. Descend
 * de 1 a chaque indice choisi (tous ont le meme "cout" desormais) : trouver vite (peu d'indices
 * utilises) laisse donc un score restant — et donc gagne — plus eleve. */
export const maxScoreForRound = (totalReveals: number): number => Math.ceil(totalReveals / 10) * 10;

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

/** Nombre de cases generiques par mot quand "Nombre de mots" est connu mais pas "Lettres" : 1 seul
 * trait par mot (pas la vraie longueur, qu'on ne connait pas encore) — juste de quoi distinguer
 * les mots entre eux, espaces largement (voir `skeletonRow` dans IndicesGameScreen). */
const GENERIC_WORD_SLOTS = 1;

/**
 * Decoupe le nom en groupes de slots pour le recap "M _ _ _" au-dessus des boutons buzz/abandon.
 * `groupByWord` separe les mots (indice "Nombre de mots" revele) au lieu d'un seul bloc,
 * `revealFirst` devoile la toute premiere lettre du nom (indice "Premiere lettre" revele),
 * `lengthKnown` (indice "Lettres" revele) donne la vraie longueur de chaque case :
 * - ni l'un ni l'autre connus : aucune case, seule la lettre revelee (au plus une) est gardee ;
 * - mots connus sans la longueur : `GENERIC_WORD_SLOTS` cases par mot (forme indicative, pas la
 *   vraie longueur) ;
 * - longueur connue (mots groupes ou non) : le vrai nombre de lettres, par mot si groupe.
 */
export const nameSkeleton = (
  name: string,
  options: { groupByWord: boolean; revealFirst: boolean; lengthKnown: boolean },
): NameSkeletonSlot[][] => {
  const words = options.groupByWord ? name.trim().split(/\s+/) : [name];
  const firstLetter = name.replace(/[^\p{L}]/gu, '')[0]?.toUpperCase() ?? null;

  if (options.groupByWord && !options.lengthKnown) {
    return words.map((_, wordIndex) =>
      Array.from({ length: GENERIC_WORD_SLOTS }, (_, letterIndex): NameSkeletonSlot =>
        options.revealFirst && wordIndex === 0 && letterIndex === 0 ? firstLetter : null,
      ),
    );
  }

  const groups = words.map((word, wordIndex) =>
    [...word.replace(/[^\p{L}]/gu, '')].map((letter, letterIndex): NameSkeletonSlot =>
      options.revealFirst && wordIndex === 0 && letterIndex === 0 ? letter.toUpperCase() : null,
    ),
  );
  if (options.lengthKnown) return groups;
  return groups.map((group) => group.filter((slot) => slot !== null)).filter((group) => group.length > 0);
};
