export type UfoIdleFrame = {
  bobY: number;
  /** Two blink phases alternating (one high while the other is low). */
  blinkOpacityA: number;
  blinkOpacityB: number;
  /** A full turn on itself, once every SPIN_PERIOD_MS — 0 outside of it. */
  spinDeg: number;
};

export type UfoButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
