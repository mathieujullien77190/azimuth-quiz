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
 * The timed keyframes of the splash's loading bar, built to look like a real loader that gets stuck: quick jumps, a
 * creeping stretch, several stalls (the long one near two thirds, a last hesitation before the end). Each keyframe says
 * when it starts (`at`, ms from the start), where the bar goes (`to`, percent) and how long it takes (`easeMs`). They are
 * jittered a little by `random` (a launch never looks like the last one) but always keep the same shape: in time order
 * and never overlapping, `to` only ever increasing, the last one ending exactly at `minMs` on a value under 100 — the bar
 * only reaches 100 % when the splash is released, never before the app is ready.
 */
export const buildProgressSteps = (minMs: number, random: () => number = Math.random): ProgressStep[] => {
  const steps: ProgressStep[] = [];
  let previousEnd = 0;
  let previousTo = 0;
  PROGRESS_BEATS.forEach((beat, index) => {
    const isLast = index === PROGRESS_BEATS.length - 1;
    const jitteredStart = beat.start + (random() - 0.5) * 2 * PROGRESS_JITTER_AT;
    // A stall is never squeezed out by the jitter: a keyframe starts a little after the previous one has ended.
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
