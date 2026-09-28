/** One cell of the recap: who was best, and with how many points. */
export type RecapCell = {
  text: string;
  /** Secondary text under `text` ("+350"). */
  detail?: string;
  /** Dot before `text`: the color of the player named there. */
  color?: string;
};

export type RecapRow = { label: string; cells: RecapCell[] };

export type RoundsRecapProps = {
  title: string;
  /** One column per criterion ("Direction", "Distance"). */
  columns: string[];
  /** One row per round. */
  rows: RecapRow[];
};
