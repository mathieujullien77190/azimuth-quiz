import { HYPHEN_SLOT } from '@/games/clues/helpers/clueSkeleton';
import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';

/** The boxed shape of what is being typed: one group per word, a slot per character typed (uppercase, a hyphen as its
 * own gap), never a blank slot — used by every game that shows an answer as it is typed (Clues). Nothing
 * typed: no groups. */
export const typedSkeleton = (text: string): NameSkeletonSlot[][] =>
  text.trim() === ''
    ? []
    : text
        .trim()
        .split(/\s+/)
        .map((word) => [...word].map((char): NameSkeletonSlot => (char === '-' ? HYPHEN_SLOT : char.toUpperCase())));
