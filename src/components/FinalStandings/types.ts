import type { ReactNode } from 'react';

export type StandingEntry = {
  name: string;
  total: number;
  /** The player's color: a dot before the name. */
  color?: string;
};

export type FinalStandingsProps = {
  /** Screen title ("Classement final"). */
  title: string;
  /** Every player's final total, in any order — ranked here, best first. */
  entries: StandingEntry[];
  /** What the game adds under the scores: its extras, and the button that leaves the game. */
  children?: ReactNode;
};

export type RankedEntry = StandingEntry & {
  /** 1 = first; tied players share the same rank. */
  rank: number;
};
