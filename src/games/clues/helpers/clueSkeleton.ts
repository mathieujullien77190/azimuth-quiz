/** Un groupe (mot) de cases : lettre deja devoilee, ou `null` (case vide a dessiner en tiret). */
export type NameSkeletonSlot = string | null;

/** Case d'un trait d'union du nom : affichee telle quelle, jamais comptee ni tapee comme lettre. */
export const HYPHEN_SLOT = '-';

const HYPHEN = /[-‐‑–]/;

const isVowel = (letter: string): boolean => /[AEIOU]/.test(letter.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase());

/**
 * Decoupe le nom en groupes de cases (un par mot) pour l'indice `letter` et le rappel du mot. La 1re lettre est toujours devoilee.
 * - `groupByWord: false` : un seul groupe, la 1re lettre, sans cases.
 * - `groupByWord: true, lengthKnown: true` : longueur reelle par mot, `HYPHEN_SLOT` aux traits d'union ;
 *   `revealVowels` ajoute toutes les voyelles.
 * - `groupByWord: true, lengthKnown: false` : nombre de mots seulement (plus atteint par `letter`, garde pour les appelants).
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

  return words.map((word, wordIndex) => {
    let letterIndex = -1;
    return [...word]
      .filter((char) => HYPHEN.test(char) || /\p{L}/u.test(char))
      .map((char): NameSkeletonSlot => {
        if (HYPHEN.test(char)) return HYPHEN_SLOT;
        letterIndex += 1;
        return (wordIndex === 0 && letterIndex === 0) || (options.revealVowels && isVowel(char))
          ? char.toUpperCase()
          : null;
      });
  });
};
