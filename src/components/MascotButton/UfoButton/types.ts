export type UfoIdleFrame = {
  bobY: number;
  /** Two blink phases alternating (one high while the other is low). */
  blinkOpacityA: number;
  blinkOpacityB: number;
};

export type UfoButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
