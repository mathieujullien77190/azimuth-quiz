/** `base`: a cross in a circle, in the normal text color (in-game headers). `accent`: a plain cross, no
 * circle, in the accent color (setup screens). */
export type QuitButtonVariant = 'base' | 'accent';

export type QuitButtonProps = {
  onPress: () => void;
  variant?: QuitButtonVariant;
};
