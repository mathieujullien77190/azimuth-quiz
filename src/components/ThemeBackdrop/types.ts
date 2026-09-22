export type Star = {
  xRatio: number;
  yRatio: number;
  radius: number;
  opacity: number;
  /** Duree d'un aller (creux -> plein) du scintillement, en ms. */
  duration: number;
  /** Delai avant le tout premier cycle, en ms : evite que toutes les etoiles clignotent en phase. */
  delay: number;
};
