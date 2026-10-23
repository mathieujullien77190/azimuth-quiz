import {
  PROGRESS_BEATS,
  PROGRESS_FINAL_MAX,
  PROGRESS_FINAL_MIN,
  PROGRESS_JITTER_AT,
  PROGRESS_JITTER_TO,
  PROGRESS_MIN_STALL,
} from './constants';
import type { ProgressStep } from './types';

/**
 * Keyframes de la barre de chargement, pour imiter un vrai chargement qui se bloque : `at` (ms depuis le debut),
 * `to` (pourcent), `easeMs`. Legerement aleatoires (`random`) mais toujours ordonnees, sans chevauchement,
 * `to` croissant, la derniere finissant exactement a `minMs` sous 100 % (la barre ne touche 100 % qu'a la liberation).
 */
export const buildProgressSteps = (minMs: number, random: () => number = Math.random): ProgressStep[] => {
  const steps: ProgressStep[] = [];
  let previousEnd = 0;
  let previousTo = 0;
  PROGRESS_BEATS.forEach((beat, index) => {
    const isLast = index === PROGRESS_BEATS.length - 1;
    const jitteredStart = beat.start + (random() - 0.5) * 2 * PROGRESS_JITTER_AT;
    // Le hasard n'ecrase jamais un blocage : une keyframe demarre un peu apres la fin de la precedente.
    const start = Math.max(jitteredStart, previousEnd / minMs + PROGRESS_MIN_STALL);
    const at = Math.round(start * minMs);
    const to = isLast
      ? PROGRESS_FINAL_MIN + random() * (PROGRESS_FINAL_MAX - PROGRESS_FINAL_MIN)
      : Math.max(previousTo + 1, beat.to + (random() - 0.5) * 2 * PROGRESS_JITTER_TO);
    const easeMs = isLast ? minMs - at : Math.round(beat.ease * minMs);
    steps.push({ at, to: Math.round(to * 10) / 10, easeMs });
    previousEnd = at + easeMs;
    previousTo = to;
  });
  return steps;
};
