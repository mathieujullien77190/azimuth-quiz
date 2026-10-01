export type ContourGuessBarProps = {
  guessText: string;
  onChangeGuessText: (text: string) => void;
  /** "Valider" (or the keyboard's "done"): only ever called with a non-empty guess. */
  onSubmit: () => void;
  /** Feedback about the previous, wrong attempt ("X loses 50 points."), shown above the input. */
  wrongText?: string | null;
  /** Somebody else's turn: the field shows what they type, live, and can't be edited; no "Valider". */
  readOnly?: boolean;
  /** A tap on the read-only field (the caller says whose turn it is). */
  onReadOnlyPress?: () => void;
};
