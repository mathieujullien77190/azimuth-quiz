import type { ReactNode } from 'react';

import type { Difficulty } from '@/types';

export type GameHeaderProps = {
  onQuit: () => void;
  /** Omitted for a phase that shows the score elsewhere instead (e.g. Silhouette's reveal
   * footer, next to its "next round" button). */
  scoreLabel?: string;
  roundNumber: number;
  totalRounds: number;
  difficulties: Difficulty[];
  /** Slotted below the round progress dots — Compass' `PlayerTabs` during local turns,
   * Silhouette's guess prompt text, or nothing at all (Compass online, Silhouette's reveal). */
  children?: ReactNode;
};
