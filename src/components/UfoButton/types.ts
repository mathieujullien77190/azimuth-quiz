export type UfoIdleFrame = {
  bobY: number;
  /** Deux phases de clignotement en alternance (l'une haute pendant que l'autre est basse). */
  blinkOpacityA: number;
  blinkOpacityB: number;
};

export type UfoButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
