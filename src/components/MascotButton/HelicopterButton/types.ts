export type HelicopterIdleFrame = {
  bobY: number;
  /** Main rotor rotation, in degrees [0, 360). */
  rotorAngleDeg: number;
  /** Tail anti-collision light. */
  blinkOpacity: number;
  /** A full turn on itself, once every SPIN_PERIOD_MS — 0 outside of it. */
  spinDeg: number;
};

export type HelicopterButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};
