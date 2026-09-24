export type ChipProps = {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
  /** Overrides the theme accent for this chip's selected background/border — for a chip whose
   * own color (e.g. a difficulty tier) would otherwise blend into the generic accent. */
  color?: string;
};
