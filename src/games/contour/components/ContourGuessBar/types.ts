export type ContourGuessBarProps = {
  /** The row above the field: what the field is for ("Pays"). */
  label: string;
  guessText: string;
  onChangeGuessText: (text: string) => void;
  /** "Valider" (or the keyboard's "done"): only ever called with a non-empty guess, by whoever may validate. */
  onSubmit: () => void;
  /** Feedback about the previous, wrong attempt ("X is wrong and loses 5 points."), shown above the input. */
  wrongText?: string | null;
  /** Given: the player already guessed this turn, a hint is the only move left — the label, the field and "Valider"
   * are hidden and only this message is shown (the draft text is kept for when the turn comes back). */
  lockedText?: string | null;
  /** Whether this player may validate (the turn-holder). Anyone can type a country at any time; the others only get
   * "Valider" greyed out, and the keyboard's "done" calls `onNotYourTurn` instead. Default: true. */
  canSubmit?: boolean;
  /** The keyboard's "done" pressed by somebody who may not validate (the caller says whose turn it is). */
  onNotYourTurn?: () => void;
};
