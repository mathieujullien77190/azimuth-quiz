import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';

export type TypedAnswerProps = {
  /** The answer as boxed words: a letter per slot (an empty box when `null`, a gap for a hyphen). */
  groups: NameSkeletonSlot[][];
};
