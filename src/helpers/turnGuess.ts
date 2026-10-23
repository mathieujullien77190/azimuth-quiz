/** Ce que la regle "une proposition par tour" lit dans une room au tour par tour (Indices). */
type TurnGuessState = {
  turnUid: string | null;
  wrongGuessUid: string | null;
  /** Indices sortis a la derniere erreur ; null si aucune cette manche (ou room d'avant la regle : pas de restriction). */
  wrongGuessHints: number | null;
};

/**
 * Le detenteur du tour a-t-il deja propose ? Un indice devoile passe la main : tant que le nombre d'indices est celui
 * de l'erreur, oui ; des qu'un indice sort, retombe a faux.
 */
export const hasGuessedThisTurn = ({ turnUid, wrongGuessUid, wrongGuessHints }: TurnGuessState, hintsRevealed: number): boolean =>
  turnUid !== null && wrongGuessUid === turnUid && wrongGuessHints !== null && wrongGuessHints === hintsRevealed;

/**
 * Une erreur est-elle encore a annoncer ("X se trompe...") ? Jusqu'a ce qu'un indice sorte apres elle.
 * `null` (pas d'erreur, ou room d'avant la regle) : seuls les gardes tour/manche l'effacent.
 */
export const missIsFresh = (wrongGuessHints: number | null, hintsRevealed: number): boolean =>
  wrongGuessHints === null || wrongGuessHints === hintsRevealed;
