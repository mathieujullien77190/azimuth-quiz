export type Star = {
  xRatio: number;
  yRatio: number;
  radius: number;
  opacity: number;
  /** Duration of one leg (dim -> full) of the twinkle, in ms. */
  duration: number;
  /** Delay before the very first cycle, in ms: prevents all stars from twinkling in phase. */
  delay: number;
};
