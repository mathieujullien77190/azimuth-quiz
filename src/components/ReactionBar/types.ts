export type ReactionBarProps = {
  /** The emojis offered, in order, in the column the toggle opens. */
  emojis: readonly string[];
  onPick: (emoji: string) => void;
  /** The accessibility label of an emoji's button ("Send 👍"). */
  labelFor: (emoji: string) => string;
  /** The accessibility label of the round button that opens and closes the column ("Reactions"). */
  toggleLabel: string;
};
