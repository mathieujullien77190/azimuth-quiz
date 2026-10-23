export type RoundsSectionProps = {
  /** Nombre de manches choisi : l'une des `ROUND_OPTIONS` (voir `@/data`). */
  rounds: number;
  onSelect: (rounds: number) => void;
  disabled?: boolean;
};
