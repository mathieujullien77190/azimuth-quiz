import { charadeFor, charadeKey, normalizeSyllable, riddleFor } from '@/games/clues/helpers/charade';
import type { CluePlace } from '@/types';

import { logChange } from '../changelog';

/** Same no-backend, journal-only pattern as every other admin edit (see `changelog.ts`,
 * `api/contour.ts`): nothing here is written to `scripts/charadeCuration.json`/
 * `scripts/charadeSyllablesCuration.json` — every change just appends a line to copy over by hand
 * (or for an assistant to apply). Two independent edits, same journal: `saveCharadeRiddle` edits
 * the riddle, a GLOBAL edit by the syllable's own text (not by place) — saving "pa"'s riddle from
 * Paris's card changes it everywhere "pa" shows up, and so does "pà"/"pâ" (`normalizeSyllable`,
 * true homophones in French — see that function's own comment). `saveCharadeSyllables` edits the
 * syllable SPLIT itself, per place (`charadeKey`) — the live `syllabify` heuristic gets it wrong
 * often enough (foreign diacritics, mostly) to need hand correction, and some names end up with no
 * usable syllable at all (e.g. "Bălți"), which is a valid result: `cluesFor` simply drops the
 * charade clue for that place rather than showing an empty card. */
export { charadeFor, normalizeSyllable, riddleFor };

/** `syllable`'s riddle text was edited (or cleared, with an empty string). Logs the *normalized*
 * key ("pà" logs as "pa") — that's the one to actually write in `scripts/charadeCuration.json`. */
export const saveCharadeRiddle = async (syllable: string, next: string): Promise<string | null> => {
  const trimmed = next.trim();
  const previous = riddleFor(syllable);
  logChange(`[Charade] syllabe « ${normalizeSyllable(syllable)} » : ${previous ?? '(vide)'} -> ${trimmed || '(vide)'}`);
  return trimmed === '' ? null : trimmed;
};

/** `place`'s syllable split was hand-corrected (a syllable added, removed, or renamed) — always
 * logs the FULL resulting list (lowercased), not a diff: that's exactly the array to paste into
 * `scripts/charadeSyllablesCuration.json` under this place's own `charadeKey`. An empty list is a
 * valid, intentional result (see this file's own doc comment above) — logged the same way. */
export const saveCharadeSyllables = async (place: Pick<CluePlace, 'code' | 'name'>, syllables: string[]): Promise<string[]> => {
  const lower = syllables.map((syllable) => syllable.toLowerCase());
  const list = lower.length > 0 ? lower.map((syllable) => `"${syllable}"`).join(', ') : '(aucune)';
  logChange(`[Charade] syllabes de « ${charadeKey(place)} » -> [${list}]`);
  return lower;
};
