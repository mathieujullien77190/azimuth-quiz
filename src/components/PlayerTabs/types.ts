import type { Player } from '@/types';

export type PlayerTabsProps = {
  players: Player[];
  /** Tab display order (indexes into `players`): drawn at random each round. */
  order: number[];
  activeIndex: number;
  /** Already-submitted answer, by player index. */
  answered: boolean[];
  /** Provided: the active tab shows this text (e.g. "Matou's turn") instead of the initials.
   * Other tabs always stay compact (initials) regardless. */
  activeLabel?: (name: string) => string;
};
