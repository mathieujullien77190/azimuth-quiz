export type UfoIdleFrame = {
  bobY: number;
  /** Two blink phases alternating (one high while the other is low). */
  blinkOpacityA: number;
  blinkOpacityB: number;
  /** Rotation of the gear under the light cone, in degrees: goes round continuously. */
  gearDeg: number;
};

export type UfoButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
