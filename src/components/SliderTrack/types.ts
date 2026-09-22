export type SliderMark = {
  /** Position sur la piste, de 0 a 1. */
  ratio: number;
  label: string;
};

export type SliderTrackProps = {
  label: string;
  valueText: string;
  /** Petite ligne sous l'en-tete (valeur secondaire). */
  caption?: string;
  /** Position de la poignee, de 0 a 1. */
  ratio: number;
  marks: SliderMark[];
  onRatioChange: (ratio: number) => void;
};
