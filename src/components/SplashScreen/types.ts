export type SplashScreenProps = {
  /** True while the splash is wanted; once false it fades out and takes itself off the screen. */
  visible: boolean;
  /** The line under the title (`t.app.tagline`, the one of the home screen). */
  tagline: string;
  /** "Chargement…". */
  loadingLabel: string;
  /** The version line at the bottom, "v2.64.1 - 🦥 - brown-throated-sloth". */
  versionLabel: string;
  /** The splash's minimum time (ms): the loading bar's schedule is built to end right then, on a value under 100 %
   * that stays until the splash is released. */
  fillMs: number;
  /** Where the bar's stalls and jumps come from (`Math.random` by default): a test passes its own for a fixed look. */
  random?: () => number;
};

/** One keyframe of the loading bar: it starts `at` ms after the splash appeared and takes the bar to `to` percent over
 * `easeMs`. */
export type ProgressStep = { at: number; to: number; easeMs: number };
