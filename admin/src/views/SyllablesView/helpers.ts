import { cluePlaces } from '../../api/places';

import { charadeFor, normalizeSyllable, riddleFor } from '../../api/charades';
import type { SyllableRow } from './types';

/** How many example place names to keep per syllable (just enough context to curate a riddle
 * that reads well wherever it shows up — not an exhaustive list). */
const MAX_EXAMPLES = 4;

/** Every distinct syllable across every Clues place (~1000, well under the ~2700 syllable
 * *occurrences* — most syllables repeat across several places), each with its riddle (global, see
 * `riddleFor`) and a few example places. Grouped by `normalizeSyllable` (case, à/â onto a) — same
 * key as the riddle dictionary itself, so "pa"/"pà"/"pâ" show up as one row, not three near-
 * duplicates. Built once (the cache only changes through the views' own edits); edited
 * in place by the view via its own local state, same no-backend/journal-only pattern as
 * `CharadeEditor`. */
export const allSyllableRows = (): SyllableRow[] => {
  const examplesBySyllable = new Map<string, string[]>();
  for (const place of cluePlaces()) {
    for (const syllable of charadeFor(place).syllables) {
      const key = normalizeSyllable(syllable);
      const examples = examplesBySyllable.get(key) ?? [];
      if (examples.length < MAX_EXAMPLES && !examples.includes(place.name)) examples.push(place.name);
      examplesBySyllable.set(key, examples);
    }
  }
  return [...examplesBySyllable.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'fr'))
    .map(([syllable, examples]) => ({ syllable, riddle: riddleFor(syllable), examples }));
};

/** Matches the syllable itself, its curated riddle text, or one of its example places. */
export const filterSyllableRows = (rows: SyllableRow[], query: string): SyllableRow[] => {
  const q = query.trim().toLowerCase();
  if (q === '') return rows;
  return rows.filter(
    (row) =>
      row.syllable.includes(q) ||
      (row.riddle ?? '').toLowerCase().includes(q) ||
      row.examples.some((name) => name.toLowerCase().includes(q)),
  );
};
