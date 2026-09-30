/** Case-insensitive ("Pa" and "pa" share the same curated riddle), and folds "à"/"â" onto "a": true
 * homophones in French (unlike the "e" family — "e"/"é"/"è" are genuinely different sounds, left alone on
 * purpose) — so a syllable spelled either way finds the same riddle. It is the id of `charadeRiddles/{...}`. */
export const normalizeSyllable = (syllable: string): string => syllable.toLowerCase().replace(/[àâ]/g, 'a');

/** The riddle of each syllable (same order), `null` for a syllable with none in `dictionary` (which is keyed
 * by normalized syllable) — what a place carries in `clues.riddles`. */
export const riddlesOf = (syllables: readonly string[], dictionary: Record<string, string | null>): (string | null)[] =>
  syllables.map((syllable) => dictionary[normalizeSyllable(syllable)] ?? null);
