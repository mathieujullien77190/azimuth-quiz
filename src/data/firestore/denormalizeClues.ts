import { sameJson } from './same';
import type { JobDoc, PlaceDoc } from './types';

/**
 * Same idea as `denormalize.ts` (the country copied into each place), for what a Clues round reads about a
 * place beyond the place itself: the label of the personality's job (`personality.job`). The game reads it off
 * the place it drew — no vocabulary to fetch. The price is paid when a job is edited: the admin rewrites the
 * copies in the same batch. Everything here is pure — it plans those rewrites, the admin writes them.
 */

/** `place` with its personality's job label up to date with `jobs` (no personality, or no job: untouched or
 * without a label). */
export const withJobLabel = (place: PlaceDoc, jobs: Record<string, JobDoc>): PlaceDoc => {
  const { personality } = place;
  if (!personality) return place;
  const { job: _previous, ...rest } = personality;
  const job = personality.jobCode ? jobs[personality.jobCode] : undefined;
  return { ...place, personality: { ...rest, ...(job && { job: { fr: job.fr, en: job.en } }) } };
};

/** The places to rewrite when job `code` becomes `job`: every personality tagged with it, its label copied. */
export const planJobChange = (code: string, job: JobDoc, places: Record<string, PlaceDoc>): Record<string, PlaceDoc> =>
  Object.fromEntries(
    Object.entries(places)
      .filter(([, place]) => place.personality?.jobCode === code)
      .map(([key, place]) => [key, withJobLabel(place, { [code]: job })] as const)
      .filter(([key, place]) => !sameJson(place, places[key])),
  );
