export type LegendItem = {
  label: string;
  color: string;
  /** Circled dot: this is the true answer. */
  ring?: boolean;
};

export type LegendProps = {
  items: LegendItem[];
};
