export type StandingEntry = {
  name: string;
  total: number;
  /** The player's color: a dot before the name. */
  color?: string;
};

/** A rank card shown above the standings (Compass' solo title: "Navigateur"...). */
export type StandingsHero = { emoji: string; title: string };

/** One cell of the rounds recap: who was best, and with how many points. */
export type RecapCell = {
  text: string;
  /** Secondary text under `text` ("+350"). */
  detail?: string;
  /** Dot before `text`: the color of the player named there. */
  color?: string;
};

export type RecapRow = { label: string; cells: RecapCell[] };

/** Round-by-round table: one row per round, one column per criterion ("Direction", "Distance"). */
export type RoundsRecap = {
  title: string;
  columns: string[];
  rows: RecapRow[];
};

export type FinalStandingsProps = {
  /** Screen title ("Classement final"). */
  title: string;
  /** Every player's final total, in any order — ranked here, best first. */
  entries: StandingEntry[];
  /** Label of the button that leaves the game. */
  homeLabel: string;
  onHome: () => void;
  /** A rank card above the list; with a single player it replaces the list. */
  hero?: StandingsHero;
  /** Who was best each round, per criterion — for the games that score several things per round. */
  recap?: RoundsRecap;
};

export type RankedEntry = StandingEntry & {
  /** 1 = first; tied players share the same rank. */
  rank: number;
};
