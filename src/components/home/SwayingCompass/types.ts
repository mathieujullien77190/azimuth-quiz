export type SwayingCompassProps = {
  /** Cote du cadran (px). */
  size: number;
};

/** Courbe de l'aiguille echantillonnee: avancement (0..1) -> angle (degres), pour `Animated.interpolate`. */
export type SwayCurve = { inputRange: number[]; outputRange: number[] };
