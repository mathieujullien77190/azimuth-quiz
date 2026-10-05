/** The needle swings between these two headings (degrees, 0 = north), one way in `SWAY_MS`, then back. */
export const NEEDLE_FROM_DEG = -38;
export const NEEDLE_TO_DEG = 52;
export const SWAY_MS = 2500;
/** The dial's drawing size (px) and the radius of its parts, in the SVG's own 300 x 300 units. */
export const DIAL_SIZE = 300;
export const DIAL_CENTER = 150;
/** The "loading" label breathes between these opacities, one way in `BLINK_MS`. */
export const BLINK_MIN_OPACITY = 0.35;
export const BLINK_MS = 700;
/** The splash fades out over this long once the app is ready (ms). */
export const FADE_OUT_MS = 250;
/**
 * The shape of the loading bar (`buildProgressSteps`): where each keyframe starts and how long it takes, as shares of
 * the splash's minimum time, and where it takes the bar (percent). Quick jumps (short `ease`) alternate with creeping
 * stretches (long `ease`) and with stalls (the gaps between the end of one and the start of the next): a long one near
 * two thirds, a last hesitation before the end. The last beat has no `ease`: it runs up to the end of the minimum time.
 */
export const PROGRESS_BEATS = [
  { start: 0.03, ease: 0.05, to: 8 },
  { start: 0.14, ease: 0.16, to: 18 },
  { start: 0.36, ease: 0.04, to: 35 },
  { start: 0.44, ease: 0.1, to: 48 },
  { start: 0.56, ease: 0.03, to: 66 },
  { start: 0.74, ease: 0.04, to: 90 },
  { start: 0.86, ease: 0, to: 97 },
] as const;
/** How far a launch moves each start (share of the minimum time) and each target (percent) from the template. */
export const PROGRESS_JITTER_AT = 0.015;
export const PROGRESS_JITTER_TO = 3;
/** The least pause (share of the minimum time) kept between two keyframes, whatever the jitter. */
export const PROGRESS_MIN_STALL = 0.015;
/** Where the last keyframe leaves the bar (percent): never 100, that is for the release. */
export const PROGRESS_FINAL_MIN = 96;
export const PROGRESS_FINAL_MAX = 97.5;
