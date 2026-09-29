import personalitiesData from '@/data/personalities.json';
import type { CluePlace } from '@/types';

/** A real, Wikipedia-documented person tied to a place (born there, or overwhelmingly identified
 * with it) — `description` is a short one/two-word tag (a profession, e.g. "footballeur"), absent
 * when there's nothing short and safe to add. Curated by hand in `scripts/personalityCuration.json`
 * (see that file's own header) and shipped via `scripts/generatePersonalities.mjs`: unlike the
 * charade clue, there's no heuristic to fall back on here — a place either has a curated entry or
 * it doesn't, nothing is ever invented. */
export type PersonalityEntry = { name: string; description: string | null };

const PERSONALITIES = personalitiesData as unknown as Record<string, PersonalityEntry>;

/** Same `${code}|${name}` key as `charadeKey`/`data/clues.ts`'s own cross-reference keys. */
export const personalityKey = (place: Pick<CluePlace, 'name' | 'code'>): string => `${place.code}|${place.name}`;

/** `place`'s curated personality, or `null` when none was found (or looked up yet) — a place with
 * `null` here never offers the `personality` clue at all (see `cluesFor`), rather than showing an
 * empty or made-up card. */
export const personalityFor = (place: Pick<CluePlace, 'name' | 'code'>): PersonalityEntry | null =>
  PERSONALITIES[personalityKey(place)] ?? null;
