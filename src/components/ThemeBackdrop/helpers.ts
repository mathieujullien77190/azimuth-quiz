import {
  STAR_MAX_OPACITY,
  STAR_MAX_RADIUS,
  STAR_MIN_OPACITY,
  STAR_MIN_RADIUS,
  TWINKLE_MAX_DELAY_MS,
  TWINKLE_MAX_DURATION_MS,
  TWINKLE_MIN_DURATION_MS,
  TWINKLE_MIN_OPACITY_RATIO,
} from './constants';
import type { Star } from './types';

/** Deterministic pseudo-random generator (same seed = same stars, every render). */
const mulberry32 = (seed: number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Position as a ratio [0, 1]: stays stable, just resizes with the screen. */
export const buildStars = (count: number, seed: number): Star[] => {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    xRatio: random(),
    yRatio: random(),
    radius: STAR_MIN_RADIUS + random() * (STAR_MAX_RADIUS - STAR_MIN_RADIUS),
    opacity: STAR_MIN_OPACITY + random() * (STAR_MAX_OPACITY - STAR_MIN_OPACITY),
    duration: TWINKLE_MIN_DURATION_MS + random() * (TWINKLE_MAX_DURATION_MS - TWINKLE_MIN_DURATION_MS),
    delay: random() * TWINKLE_MAX_DELAY_MS,
  }));
};

/**
 * A star's opacity at instant `elapsedMs` (since mount): a sine wave between
 * its dim floor and its max opacity, phase-shifted by its own `delay` and paced by its `duration`.
 * A pure function of the star and time: no need for Animated (and its host of
 * web interop headaches with react-native-svg).
 */
export const twinkleOpacity = (star: Star, elapsedMs: number): number => {
  const floor = star.opacity * TWINKLE_MIN_OPACITY_RATIO;
  const phase = ((elapsedMs + star.delay) / star.duration) * Math.PI * 2;
  const t = (Math.sin(phase) + 1) / 2;
  return floor + t * (star.opacity - floor);
};
