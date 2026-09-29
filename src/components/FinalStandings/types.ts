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
  /** This device's own player name (names are unique within a room) — the winner banner says
   * "Vous gagnez !" instead of naming them, same treatment as Clues' own round-winner banner.
   * Omitted (e.g. a name-less sample in Storybook) always names the winner instead. */
  localName?: string;
  /** What the game adds under the scores: its extras, and the button that leaves the game. */
  children?: ReactNode;
};

export type RankedEntry = StandingEntry & {
  /** 1 = first; tied players share the same rank. */
  rank: number;
};
