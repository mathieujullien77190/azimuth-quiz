/** What the "one guess per turn" rule reads from a turn-based room (Indices, Silhouette). */
type TurnGuessState = {
  turnUid: string | null;
  wrongGuessUid: string | null;
  /** How many clues/hints were out when the last wrong guess was made; null when none was made this round (and for a
   * room made before the rule existed: no restriction). */
  wrongGuessHints: number | null;
};

/**
 * Whether the player holding the turn has already made their guess this turn. A turn ends when a hint is revealed (which
 * passes the hand), so "this turn" is "while the number of revealed hints is still the one at the wrong guess": it falls
 * back to false by itself the moment a hint is revealed, and the turn coming back to the same player later is a new turn.
 * The only thing left to the player in the meantime is to reveal a hint.
 */
export const hasGuessedThisTurn = ({ turnUid, wrongGuessUid, wrongGuessHints }: TurnGuessState, hintsRevealed: number): boolean =>
  turnUid !== null && wrongGuessUid === turnUid && wrongGuessHints !== null && wrongGuessHints === hintsRevealed;
