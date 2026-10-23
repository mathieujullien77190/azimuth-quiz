import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';

export type TypedAnswerProps = {
  /** Reponse en mots encadres : une lettre par case (case vide si `null`, ecart pour un tiret). */
  groups: NameSkeletonSlot[][];
};
