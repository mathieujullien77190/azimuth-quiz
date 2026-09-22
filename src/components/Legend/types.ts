export type LegendItem = {
  label: string;
  color: string;
  /** Pastille cerclee : c'est la vraie reponse. */
  ring?: boolean;
};

export type LegendProps = {
  items: LegendItem[];
};
