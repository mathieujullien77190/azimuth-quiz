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
