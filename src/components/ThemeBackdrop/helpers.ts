import { STAR_MAX_OPACITY, STAR_MAX_RADIUS, STAR_MIN_OPACITY, STAR_MIN_RADIUS } from './constants';
import type { GridLines, Star } from './types';

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
  }));
};

export const buildGridLines = (width: number, height: number, spacing: number): GridLines => ({
  vertical: Array.from({ length: Math.ceil(width / spacing) + 1 }, (_, i) => i * spacing),
  horizontal: Array.from({ length: Math.ceil(height / spacing) + 1 }, (_, i) => i * spacing),
});
