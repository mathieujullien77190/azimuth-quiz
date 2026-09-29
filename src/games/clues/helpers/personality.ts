import type { CluePlace } from '@/types';

/** A real, Wikipedia-documented person tied to a place (born there, or overwhelmingly identified
 * with it) — `description` is a short one/two-word tag (a profession, e.g. "footballeur"), absent
 * when there's nothing short and safe to add. Curated by hand in `data/places/personalityPlaces.json`
 * (`[name, jobCode]` — `jobCode` looks up the shared `data/personalityJobs.json` vocabulary, already
 * resolved to its French text by the time it reaches here, see `data/places/codec.ts`'s doc
 * comment): unlike the charade clue, there's no heuristic to fall back on here, a place either has
 * a curated entry or it doesn't, nothing is ever invented. */
export type PersonalityEntry = { name: string; description: string | null };

/** `place`'s curated personality, or `null` when none was found (or curated yet) — a place with
 * `null` here never offers the `personality` clue at all (see `cluesFor`), rather than showing an
 * empty or made-up card. */
export const personalityFor = (place: Pick<CluePlace, 'personality'>): PersonalityEntry | null =>
  place.personality ?? null;
