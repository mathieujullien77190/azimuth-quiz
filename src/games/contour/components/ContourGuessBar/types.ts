export type ContourGuessBarProps = {
  guessText: string;
  onChangeGuessText: (text: string) => void;
  /** "Valider" (or the keyboard's "done"): only ever called with a non-empty guess. */
  onSubmit: () => void;
  /** "💡": reveals the next hint tier. */
  onHint: () => void;
  /** Feedback about the previous, wrong attempt ("X loses 50 points."), shown above the input. */
  wrongText?: string | null;
};
