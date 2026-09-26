/** A group (word) of "slots" for the Indices "letter" clue and the word recap above the
 * buzz/give-up buttons: each slot is either an already-revealed letter, or `null` (a box to
 * draw as a dash, not revealed yet). */
export type NameSkeletonSlot = string | null;

const isVowel = (letter: string): boolean =>
  /[AEIOU]/.test(
    letter
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase(),
  );

/**
 * Splits the name into groups of slots (one group per word) for the Indices "letter" clue (2
 * clicks: first letter alone, then every letter) and the word recap above the buzz/give-up
 * buttons. The first letter of the name is always revealed — this is only ever called once that
 * much is known:
 * - `groupByWord: false` (1st click): a single group holding just the first letter, no boxes.
 * - `groupByWord: true, lengthKnown: true` (2nd click, or the "Vowels" bonus clue): the real
 *   number of letters per word, `revealVowels` additionally fills in every vowel of the name on
 *   top of the first letter.
 * - `groupByWord: true, lengthKnown: false`: word count only (real length not known yet) — no
 *   longer reachable from the `letter` clue itself (its 2nd click already knows the length), kept
 *   as a distinct case since callers may still combine the flags this way.
 */
export const nameSkeleton = (
  name: string,
  options: { groupByWord: boolean; lengthKnown: boolean; revealVowels?: boolean },
): NameSkeletonSlot[][] => {
  const firstLetter = name.replace(/[^\p{L}]/gu, '')[0]?.toUpperCase() ?? null;

  if (!options.groupByWord) {
    return firstLetter !== null ? [[firstLetter]] : [];
  }

  const words = name.trim().split(/\s+/);

  if (!options.lengthKnown) {
    return words.map((_, wordIndex): NameSkeletonSlot[] => [wordIndex === 0 ? firstLetter : null]);
  }

  return words.map((word, wordIndex) =>
    [...word.replace(/[^\p{L}]/gu, '')].map((letter, letterIndex): NameSkeletonSlot =>
      (wordIndex === 0 && letterIndex === 0) || (options.revealVowels && isVowel(letter)) ? letter.toUpperCase() : null,
    ),
  );
};
