import { normalizeSyllable, riddlesOf } from './riddles';
import { sameJson } from './same';
import type { JobDoc, PlaceDoc } from './types';

/**
 * Same idea as `denormalize.ts` (the country copied into each place), for what a Clues round reads about a
 * place beyond the place itself: the riddle of each syllable (`clues.riddles`, next to `clues.syllables`) and
 * the label of the personality's job (`personality.job`). The game reads them off the place it drew — no
 * dictionary, no vocabulary to fetch. The price is paid when a riddle or a job is edited: the admin rewrites
 * the copies in the same batch. Everything here is pure — it plans those rewrites, the admin writes them.
 */

/** The riddle dictionary as the admin holds it: `normalized syllable -> riddle` (`null`: none yet). */
type Riddles = Record<string, string | null>;

/** `place` with the riddles of its own syllables up to date with `riddles` (no Clues data: untouched). */
export const withRiddles = (place: PlaceDoc, riddles: Riddles): PlaceDoc =>
  place.clues ? { ...place, clues: { ...place.clues, riddles: riddlesOf(place.clues.syllables, riddles) } } : place;

/** `place` with its personality's job label up to date with `jobs` (no personality, or no job: untouched or
 * without a label). */
export const withJobLabel = (place: PlaceDoc, jobs: Record<string, JobDoc>): PlaceDoc => {
  const { personality } = place;
  if (!personality) return place;
  const { job: _previous, ...rest } = personality;
  const job = personality.jobCode ? jobs[personality.jobCode] : undefined;
  return { ...place, personality: { ...rest, ...(job && { job: { fr: job.fr, en: job.en } }) } };
};

/** The places to rewrite when the riddle of `syllable` becomes `riddle` (`null`: cleared): every place with
 * that syllable (whatever its accents, see `normalizeSyllable`), its `clues.riddles` recomputed. */
export const planRiddleChange = (
  syllable: string,
  riddle: string | null,
  places: Record<string, PlaceDoc>,
  riddles: Riddles,
): Record<string, PlaceDoc> => {
  const id = normalizeSyllable(syllable);
  const next = { ...riddles, [id]: riddle };
  return Object.fromEntries(
    Object.entries(places)
      .filter(([, place]) => place.clues?.syllables.some((each) => normalizeSyllable(each) === id))
      .map(([key, place]) => [key, withRiddles(place, next)] as const)
      .filter(([key, place]) => !sameJson(place, places[key])),
  );
};

/** The places to rewrite when job `code` becomes `job`: every personality tagged with it, its label copied. */
export const planJobChange = (code: string, job: JobDoc, places: Record<string, PlaceDoc>): Record<string, PlaceDoc> =>
  Object.fromEntries(
    Object.entries(places)
      .filter(([, place]) => place.personality?.jobCode === code)
      .map(([key, place]) => [key, withJobLabel(place, { [code]: job })] as const)
      .filter(([key, place]) => !sameJson(place, places[key])),
  );
