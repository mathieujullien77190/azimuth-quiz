/** Une cellule : le meilleur et ses points. */
export type RecapCell = {
  text: string;
  /** Texte secondaire sous `text` ("+350"). */
  detail?: string;
  /** Point avant `text` : couleur du joueur nomme. */
  color?: string;
};

export type RecapRow = { label: string; cells: RecapCell[] };

export type RoundsRecapProps = {
  title: string;
  columns: string[];
  rows: RecapRow[];
};
