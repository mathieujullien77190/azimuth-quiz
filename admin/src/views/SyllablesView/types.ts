/** One distinct syllable (lowercased — the riddle dictionary's own key, see `riddleFor`), its
 * curated riddle if any, and a few example places that have it (context while curating: "pa" —
 * used in Paris, Palerme...). This view's whole unit — unlike a place's own syllable list
 * (`CharadeEditor`), a syllable here is never tied to just one place. */
export type SyllableRow = {
  syllable: string;
  riddle: string | null;
  examples: string[];
};
