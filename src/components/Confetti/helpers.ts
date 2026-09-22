import {
  MAX_DELAY_MS,
  MAX_DRIFT_AMPLITUDE,
  MAX_DRIFT_PERIOD_MS,
  MAX_FALL_MS,
  MAX_SIZE,
  MAX_SPIN_SPEED,
  MIN_DRIFT_AMPLITUDE,
  MIN_DRIFT_PERIOD_MS,
  MIN_FALL_MS,
  MIN_SIZE,
} from './constants';
import type { ConfettiPiece } from './types';

/** Generateur pseudo-aleatoire deterministe (meme graine = memes confettis, a chaque rendu). */
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

export const buildPieces = (count: number, seed: number, colors: readonly string[]): ConfettiPiece[] => {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    xRatio: random(),
    color: colors[Math.floor(random() * colors.length)],
    size: MIN_SIZE + random() * (MAX_SIZE - MIN_SIZE),
    fallMs: MIN_FALL_MS + random() * (MAX_FALL_MS - MIN_FALL_MS),
    delayMs: random() * MAX_DELAY_MS,
    driftAmplitude: MIN_DRIFT_AMPLITUDE + random() * (MAX_DRIFT_AMPLITUDE - MIN_DRIFT_AMPLITUDE),
    driftPeriodMs: MIN_DRIFT_PERIOD_MS + random() * (MAX_DRIFT_PERIOD_MS - MIN_DRIFT_PERIOD_MS),
    spinSpeed: (random() * 2 - 1) * MAX_SPIN_SPEED,
    shape: random() < 0.5 ? 'rect' : 'circle',
  }));
};

/**
 * Position/rotation d'un confetti a l'instant `elapsedMs` : tombe du haut vers le bas en
 * `fallMs`, puis reboucle (chute continue tant que l'ecran reste affiche). Se balance
 * horizontalement de part et d'autre de sa colonne de depart.
 */
export const pieceTransform = (
  piece: ConfettiPiece,
  elapsedMs: number,
  width: number,
  height: number,
): { x: number; y: number; rotation: number } => {
  const span = height + piece.size * 4;
  const progress = ((elapsedMs - piece.delayMs) % piece.fallMs) / piece.fallMs;
  const fallRatio = ((progress % 1) + 1) % 1;
  const y = fallRatio * span - piece.size * 2;
  const drift = Math.sin((elapsedMs / piece.driftPeriodMs) * 2 * Math.PI) * piece.driftAmplitude;
  const x = piece.xRatio * width + drift;
  const rotation = (elapsedMs * piece.spinSpeed) % 360;
  return { x, y, rotation };
};
