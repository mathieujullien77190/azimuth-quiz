import type { Player } from '@/types';

export type PlayerTabsProps = {
  players: Player[];
  /** Tab display order (indexes into `players`) — `GameHeader` passes the identity: the caller has
   * already put `players` in the order it wants shown (the round's own, see `playersForRound`). */
  order: number[];
  activeIndex: number;
  /** Provided: the active tab shows this text (e.g. "Matou's turn") instead of the initials.
   * Other tabs always stay compact (initials) regardless. */
  activeLabel?: (name: string) => string;
};
