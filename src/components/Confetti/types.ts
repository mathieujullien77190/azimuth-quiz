export type ConfettiPiece = {
  xRatio: number;
  color: string;
  size: number;
  /** Duree d'une chute complete (haut -> bas), en ms ; boucle ensuite. */
  fallMs: number;
  /** Decalage avant le premier passage, en ms : evite que tout tombe en meme temps. */
  delayMs: number;
  /** Amplitude et periode du balancement horizontal, en px / ms. */
  driftAmplitude: number;
  driftPeriodMs: number;
  /** Vitesse de rotation, en degres par ms. */
  spinSpeed: number;
};
