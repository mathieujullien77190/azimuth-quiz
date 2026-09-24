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

export type Cloud = {
  /** Starting horizontal position, as a ratio of screen width + cloud width (so it can start
   * just off-screen): see `cloudXRatio`. */
  xRatio: number;
  /** Vertical position, as a ratio of screen height — kept in the upper portion of the sky. */
  yRatio: number;
  scale: number;
  opacity: number;
  /** How long the cloud takes to drift fully across the screen (and wrap back), in ms. */
  driftDurationMs: number;
};
