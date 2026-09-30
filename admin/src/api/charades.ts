import { charadeFor, normalizeSyllable } from '@/games/clues/helpers/charade';
import type { CluePlace } from '@/types';

import { withRiddles } from '@/data/firestore/denormalizeClues';

import { applyRiddleChange, data, putPlace, putRiddle } from '../data';

/** Two independent edits, both written to Firestore: `saveCharadeRiddle` edits the riddle, a GLOBAL
 * edit by the syllable's own text (not by place) — saving "pa"'s riddle from Paris's card changes it
 * everywhere "pa" shows up, and so does "pà"/"pâ" (`normalizeSyllable`, true homophones in French).
 * `saveCharadeSyllables` edits the syllable SPLIT itself, per place (`places/{key}.clues.syllables`):
 * the heuristic that produced it gets it wrong often enough (foreign diacritics, mostly) to need
 * hand correction. Some names end up with no usable syllable at all (e.g. "Bălți"), which is a
 * valid result: `cluesFor` simply drops the charade clue for that place. */
export { charadeFor, normalizeSyllable };

/** The curated riddle for this syllable (`charadeRiddles`, complete dictionary), or `null`. */
export const riddleFor = (syllable: string): string | null => data().riddles[normalizeSyllable(syllable)] ?? null;

/** `syllable`'s riddle text was edited (or cleared, with an empty string). Stored under the *normalized*
 * key ("pà" is saved as "pa") — that's the document id. */
export const saveCharadeRiddle = async (syllable: string, next: string): Promise<string | null> => {
  const trimmed = next.trim();
  await applyRiddleChange(syllable, trimmed === '' ? null : trimmed);
  return trimmed === '' ? null : trimmed;
};

/** `place`'s syllable split was hand-corrected (a syllable added, removed, or renamed) — the FULL resulting
 * list (lowercased) is stored. A syllable new to the riddle dictionary gets an empty entry, so the
 * dictionary stays the complete check-list of what remains to curate. */
export const saveCharadeSyllables = async (
  place: Pick<CluePlace, 'code' | 'name' | 'key'>,
  syllables: string[],
): Promise<string[]> => {
  const lower = syllables.map((syllable) => syllable.toLowerCase());
  const doc = data().places[place.key];
  // The place carries the riddle of each of its syllables: recomputed for the new split.
  await putPlace(place.key, withRiddles({ ...doc, clues: { ...doc.clues!, syllables: lower } }, data().riddles));
  for (const syllable of new Set(lower.map(normalizeSyllable))) {
    if (!(syllable in data().riddles)) await putRiddle(syllable, null);
  }
  return lower;
};
