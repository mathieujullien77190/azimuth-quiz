export type SwayingCompassProps = {
  /** Cote du cadran (px). */
  size: number;
  /** Source de l'aleatoire (`Math.random` par defaut) : un test passe la sienne pour un rendu fixe. */
  random?: () => number;
};

/** Courbe de l'aiguille echantillonnee: avancement (0..1) -> angle (degres), pour `Animated.interpolate`. */
export type SwayCurve = { inputRange: number[]; outputRange: number[] };

/** Un cycle de l'aiguille: balancier jusqu'a `swayTo` (avancement de la courbe), puis `turnDeg` degres de tours rapides. */
export type SwayCycle = { swayTo: number; swayMs: number; turnDeg: number; spinMs: number };
