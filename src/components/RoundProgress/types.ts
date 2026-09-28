import type { Difficulty } from '@/types';

export type RoundProgressProps = {
  roundNumber: number;
  totalRounds: number;
  /** The round's difficulty filter(s): a single-element array for Clues (one active
   * difficulty), possibly several for Compass (multi-select) — see RoundProgress.tsx. */
  difficulties: Difficulty[];
  /** Online games only: the room code, shown right after the difficulty. */
  roomCode?: string;
};
