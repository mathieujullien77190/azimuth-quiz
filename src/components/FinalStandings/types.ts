export type StandingEntry = { name: string; total: number };

export type FinalStandingsProps = {
  /** Screen title ("Classement final"). */
  title: string;
  /** Every player's final total, in any order — sorted here, best first. */
  entries: StandingEntry[];
  /** Label of the button that leaves the game. */
  homeLabel: string;
  onHome: () => void;
};
