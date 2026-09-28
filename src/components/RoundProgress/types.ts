import type { Difficulty } from '@/types';

export type RoundProgressProps = {
  roundNumber: number;
  totalRounds: number;
  /** The round's difficulty — a single one, every game now plays one. */
  difficulty: Difficulty;
};
