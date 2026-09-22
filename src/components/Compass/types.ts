export type CompassProps = {
  size: number;
  /** Cap choisi par le joueur (null = pas encore choisi). */
  bearing: number | null;
  /** Couleur de l'aiguille du joueur (par defaut : accent du design). */
  color?: string;
  /** Aiguilles supplementaires (reponses des autres joueurs a la revelation). */
  extraNeedles?: CompassNeedle[];
  /** Vrai cap, affiche a la revelation. */
  truthBearing?: number | null;
  /** Sur mobile : le cadran tourne pour que le N pointe vers le vrai nord (capteur du telephone). */
  live?: boolean;
  /** Absent = boussole decorative, non interactive. */
  onChange?: (bearing: number) => void;
};

export type Point = {
  x: number;
  y: number;
};

export type Tick = {
  key: string;
  from: Point;
  to: Point;
  kind: 'cardinal' | 'intercardinal' | 'minor';
};

export type CompassNeedle = {
  bearing: number;
  color: string;
};

export type CompassDialProps = {
  size: number;
  bearing: number | null;
  color?: string;
  extraNeedles: CompassNeedle[];
  truthBearing: number | null;
};

export type UseHeadingResult = {
  heading: number | null;
  /** A appeler au premier toucher de la boussole : sur le web, amorce l'ecoute du capteur
   * (et, sur iOS, la demande de permission, qui exige un geste utilisateur). Sans effet ailleurs. */
  onTouch: () => void;
};

/** Evenement d'orientation navigateur, avec le champ non-standard de Safari iOS en plus. */
export type WebOrientationEvent = DeviceOrientationEvent & {
  /** Safari iOS uniquement : cap deja absolu (vrai nord), en degres. */
  webkitCompassHeading?: number;
};
