import type { StyleProp, ViewStyle } from 'react-native';

/** Which color the button's border and label take: the app's accent, or the danger red (expel,
 * delete...). */
export type MiniButtonVariant = 'accent' | 'danger';

export type MiniButtonProps = {
  label: string;
  onPress: () => void;
  variant?: MiniButtonVariant;
  /** Read out instead of `label` when the label alone is ambiguous ("Kick" → "Remove Anna"). */
  accessibilityLabel?: string;
  /** For the caller's own spacing (`marginTop`...) — the button itself carries none. */
  style?: StyleProp<ViewStyle>;
};
