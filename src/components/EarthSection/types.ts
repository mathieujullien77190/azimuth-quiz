/** Une reponse a dessiner sur la Terre : toujours un arc, et une ligne droite en plus si demande. */
export type EarthMark = {
  bearing: number;
  /** Distance de surface (longueur de l'arc) : fixe aussi ou la corde arrive, en mode ligne droite. */
  distanceKm: number;
  color: string;
  /** Reponses des autres joueurs pendant que le joueur courant repond : estompees. */
  opacity?: number;
  /** Vraie reponse : cerclee, et declenche le zoom. */
  isTruth?: boolean;
};

export type EarthSectionProps = {
  size: number;
  marks: EarthMark[];
  /** Ajoute la corde (ligne droite a travers la Terre) jusqu'a la meme destination que l'arc. */
  showStraightLine: boolean;
  /** Multiplie le zoom automatique (bouton +/- a la revelation) ; 1 = pas de zoom manuel. */
  zoomMultiplier?: number;
};

export type Point = {
  x: number;
  y: number;
};

/** 1 = droite (cap vers l'est), -1 = gauche (cap vers l'ouest). */
export type Side = 1 | -1;
