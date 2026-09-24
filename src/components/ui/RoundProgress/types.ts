import type { Difficulty } from '@/types';

export type RoundProgressProps = {
  roundNumber: number;
  totalRounds: number;
  /** The round's difficulty filter(s): a single-element array for Indices (one active
   * difficulty), possibly several for Boussole (multi-select) — see RoundProgress.tsx. */
  difficulties: Difficulty[];
};
