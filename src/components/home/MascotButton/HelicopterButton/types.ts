export type HelicopterIdleFrame = {
  bobY: number;
  /** Rotation du rotor, en degres [0, 360). */
  rotorAngleDeg: number;
  /** Feu anticollision de queue. */
  blinkOpacity: number;
  /** Rotation de l'engrenage suspendu, en degres (continue). */
  gearDeg: number;
};

export type HelicopterButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
