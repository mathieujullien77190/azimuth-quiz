export type RoundsSectionProps = {
  /** Currently selected round count — one of `ROUND_OPTIONS` (see `@/data`). */
  rounds: number;
  onSelect: (rounds: number) => void;
  disabled?: boolean;
};
