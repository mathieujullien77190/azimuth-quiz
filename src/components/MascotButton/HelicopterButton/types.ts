export type HelicopterIdleFrame = {
  bobY: number;
  /** Main rotor rotation, in degrees [0, 360). */
  rotorAngleDeg: number;
  /** Tail anti-collision light. */
  blinkOpacity: number;
};

export type HelicopterButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
