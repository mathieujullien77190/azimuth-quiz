import {
  STAR_MAX_OPACITY,
  STAR_MAX_RADIUS,
  STAR_MIN_OPACITY,
  STAR_MIN_RADIUS,
  TWINKLE_MAX_DELAY_MS,
  TWINKLE_MAX_DURATION_MS,
  TWINKLE_MIN_DURATION_MS,
} from './constants';
import type { Star } from './types';

/** Generateur pseudo-aleatoire deterministe (meme graine = memes etoiles, a chaque rendu). */
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

/** Position en ratio [0, 1] : reste stable, se redimensionne juste avec l'ecran. */
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
