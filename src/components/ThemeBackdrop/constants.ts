// Star count and seed (fixed: the sky shouldn't "jump" on every render).
export const STAR_COUNT = 70;
export const STAR_SEED = 7;
export const STAR_MIN_RADIUS = 0.4;
export const STAR_MAX_RADIUS = 1.6;
export const STAR_MIN_OPACITY = 0.15;
export const STAR_MAX_OPACITY = 0.75;

// Twinkle: each star breathes between TWINKLE_MIN_OPACITY_RATIO x its max opacity and
// its max opacity, at its own pace (duration + delay before the first cycle).
export const TWINKLE_MIN_OPACITY_RATIO = 0.25;
export const TWINKLE_MIN_DURATION_MS = 1400;
export const TWINKLE_MAX_DURATION_MS = 3600;
export const TWINKLE_MAX_DELAY_MS = 3000;
// Twinkle refresh rate: no need for 60fps for such a slow effect.
export const TWINKLE_TICK_MS = 120;

// Cloud count and seed (fixed: the sky shouldn't "jump" on every render).
export const CLOUD_COUNT = 6;
export const CLOUD_SEED = 11;
export const CLOUD_MIN_SCALE = 0.6;
export const CLOUD_MAX_SCALE = 1.3;
export const CLOUD_MIN_OPACITY = 0.5;
export const CLOUD_MAX_OPACITY = 0.9;
// Kept in the upper half of the sky, never lower than mid-screen.
export const CLOUD_MAX_Y_RATIO = 0.5;
// Full screen-width crossing (off-screen right back to off-screen left) takes this long.
export const CLOUD_MIN_DRIFT_MS = 45000;
export const CLOUD_MAX_DRIFT_MS = 90000;
// Base cloud silhouette, as 3 overlapping puffs (relative to the cloud's own width/height,
// before `scale`): a wide flat belly with two rounder puffs on top.
export const CLOUD_WIDTH = 120;
export const CLOUD_HEIGHT = 46;
export const CLOUD_PUFFS = [
  { cx: 0.5, cy: 0.65, rx: 0.5, ry: 0.35 },
  { cx: 0.3, cy: 0.42, rx: 0.28, ry: 0.28 },
  { cx: 0.62, cy: 0.35, rx: 0.34, ry: 0.32 },
] as const;
