import { HYPHEN_SLOT } from '@/games/clues/helpers/clueSkeleton';
import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';

/**
 * Forme encadree de la saisie : un groupe par mot, une case par caractere tape (majuscule, le tiret fait un
 * ecart), jamais de case vide. Utilise par tout jeu qui montre une reponse en cours de saisie (Indices).
 */
export const typedSkeleton = (text: string): NameSkeletonSlot[][] =>
  text.trim() === ''
    ? []
    : text
        .trim()
        .split(/\s+/)
        .map((word) => [...word].map((char): NameSkeletonSlot => (char === '-' ? HYPHEN_SLOT : char.toUpperCase())));
