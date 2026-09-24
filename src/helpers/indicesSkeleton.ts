/** A group (word) of "slots" for the Indices "letter" clue and the word recap above the
 * buzz/give-up buttons: each slot is either an already-revealed letter, or `null` (a box to
 * draw as a dash, not revealed yet). */
export type NameSkeletonSlot = string | null;

/** Number of generic boxes per word at stage 1 (word count + first letter known, real length
 * not yet): just 1 dash per word, not the real length — just enough to tell the words apart. */
const GENERIC_WORD_SLOTS = 1;

const isVowel = (letter: string): boolean =>
  /[AEIOU]/.test(
    letter
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase(),
  );

/**
 * Splits the name into groups of slots (one group per word) for the Indices "letter" clue and
 * the word recap above the buzz/give-up buttons. The first letter of the name is always
 * revealed — this is only ever called once that much is known (see the `letter` clue,
 * IndicesGameScreen/IndicesClueCard): `lengthKnown` (2nd click on `letter`) swaps the generic
 * 1-box-per-word shape for the real number of letters per word, `revealVowels` (the "Vowels"
 * bonus clue) fills in every vowel of the name on top of whatever else is known.
 */
export const nameSkeleton = (name: string, options: { lengthKnown: boolean; revealVowels?: boolean }): NameSkeletonSlot[][] => {
  const words = name.trim().split(/\s+/);
  const firstLetter = name.replace(/[^\p{L}]/gu, '')[0]?.toUpperCase() ?? null;

  if (!options.lengthKnown) {
    return words.map((_, wordIndex) =>
      Array.from({ length: GENERIC_WORD_SLOTS }, (_, letterIndex): NameSkeletonSlot =>
        wordIndex === 0 && letterIndex === 0 ? firstLetter : null,
      ),
    );
  }

  return words.map((word, wordIndex) =>
    [...word.replace(/[^\p{L}]/gu, '')].map((letter, letterIndex): NameSkeletonSlot =>
      (wordIndex === 0 && letterIndex === 0) || (options.revealVowels && isVowel(letter)) ? letter.toUpperCase() : null,
    ),
  );
};
