export type SliderMark = {
  /** Position on the track, from 0 to 1. */
  ratio: number;
  label: string;
};

export type SliderTrackProps = {
  label: string;
  valueText: string;
  /** Small line below the header (secondary value). */
  caption?: string;
  /** Thumb position, from 0 to 1. */
  ratio: number;
  marks: SliderMark[];
  onRatioChange: (ratio: number) => void;
};
