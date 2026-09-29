/**
 * A rough, heuristic ORTHOGRAPHIC (spelling-based, not phonetic) French syllabification —
 * `scripts/generateCharades.mjs` ports this same algorithm by hand into plain JS for its own
 * Node-only, no-build-step run (same reasoning as `generateContours.mjs`'s own ported board
 * math: keep the two in sync by hand if this file's rules ever change).
 *
 * Rule of thumb: French syllables alternate consonant groups and vowel groups, roughly
 * "cesure avant une consonne entre deux voyelles" (V-CV: one consonant between two vowels joins
 * the following syllable) and "VC-CV" (two or more consonants split, the first staying with the
 * previous syllable). A run of vowel LETTERS (aeiouyâäàéèêëîïôöûüùœ) is read as a single vowel
 * sound — this is what makes a written digraph/trigraph like "ou", "oi", "eau", "ai" fall out
 * for free, with no digraph table needed: they are already consecutive vowel letters. A nasal
 * "n"/"m" right after a vowel run, itself followed by a consonant (or the end of the word) and
 * not doubled, is folded into that vowel run too (so "an", "on", "in"... read as one sound,
 * matching how "Nantes" is actually said: "Nan-tes", not "Na-ntes").
 *
 * Known limitations (documented rather than chased): this is WRITTEN syllabification, so a
 * silent final "e" still counts as its own syllable ("Nice" -> "Ni-ce", 2 written syllables,
 * though it is said as one); a name with an apostrophe ("N’Djamena") is cut at the apostrophe
 * like a word boundary, which can leave a one-letter fragment; rare digraphs this heuristic
 * doesn't special-case (e.g. "qu", "gn", "ch" as a single consonant *sound*) are simply treated
 * as ordinary consonant letters, which occasionally shifts a boundary from where a native
 * speaker would put it. None of this is chased for perfection — see the module's own doc comment
 * on `charadeFor` for how a rough split still works fine for the game.
 */

const VOWEL_LETTERS = new Set([...'aeiouyâäàéèêëîïôöûüùœ']);

const isVowel = (char: string): boolean => VOWEL_LETTERS.has(char.toLowerCase());
const isNasal = (char: string): boolean => char.toLowerCase() === 'n' || char.toLowerCase() === 'm';

type VowelSpan = { start: number; end: number };

/** Every maximal run of vowel letters in `word`, each extended by one trailing "n"/"m" when that
 * consonant nasalizes the vowel (followed by another consonant or the end of the word, and not
 * itself doubled — "Cannes" keeps its "nn" as an ordinary double consonant, not a nasal vowel). */
const vowelSpans = (word: string): VowelSpan[] => {
  const spans: VowelSpan[] = [];
  let i = 0;
  while (i < word.length) {
    if (!isVowel(word[i])) {
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < word.length && isVowel(word[end])) end += 1;
    if (end < word.length && isNasal(word[end])) {
      const after = word[end + 1];
      const doubled = after !== undefined && after.toLowerCase() === word[end].toLowerCase();
      if (!doubled && (after === undefined || !isVowel(after))) end += 1;
    }
    spans.push({ start: i, end });
    i = end;
  }
  return spans;
};

/** One word (no space/hyphen/apostrophe inside) split into its written syllables — always at
 * least one, even for a word with no vowel at all (kept whole, e.g. a bare "N" left over from
 * splitting "N’Djamena" at its apostrophe). */
const syllabifyWord = (word: string): string[] => {
  const spans = vowelSpans(word);
  if (spans.length === 0) return [word];

  const starts = [0];
  for (let s = 1; s < spans.length; s += 1) {
    const gap = spans[s].start - spans[s - 1].end;
    // 0 or 1 consonant between two vowel runs: it joins the next syllable (V-CV, or a bare
    // hiatus V-V). 2 or more: the first stays put, the rest starts the next syllable (VC-CV).
    starts.push(spans[s - 1].end + (gap >= 2 ? 1 : 0));
  }
  return starts.map((start, index) => word.slice(start, starts[index + 1] ?? word.length));
};

/**
 * `name` split into its written syllables, word by word: split first on whitespace, hyphens and
 * apostrophes (each word syllabified on its own, never merging a syllable across that boundary —
 * "Le Havre" stays "Le" + "Ha-vre", not "Lha-vre"), then every word's own syllables are
 * concatenated into one flat, ordered list. Never empty for a non-blank `name` (a word with no
 * vowel at all still comes back as one whole "syllable", see `syllabifyWord`).
 */
export const syllabify = (name: string): string[] => {
  const words = name.split(/[\s'’-]+/).filter((word) => word.length > 0);
  const syllables = words.flatMap(syllabifyWord);
  return syllables.length > 0 ? syllables : [name];
};
