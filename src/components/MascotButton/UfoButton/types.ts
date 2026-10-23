export type UfoIdleFrame = {
  bobY: number;
  /** Deux phases de clignotement alternees. */
  blinkOpacityA: number;
  blinkOpacityB: number;
  /** Rotation de l'engrenage sous le cone, en degres (continue). */
  gearDeg: number;
};

export type UfoButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
