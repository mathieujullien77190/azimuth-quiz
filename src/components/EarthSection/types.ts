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
  /** Affiche les boutons +/- (revelation) : part du zoom ideal, descend jusqu'a 1 (Terre entiere). */
  zoomControls?: boolean;
  /** Autorise le satellite en orbite a zoom 1 (voir plus bas) independamment des boutons +/- :
   * par defaut aligne sur `zoomControls` (comportement Boussole inchange), mais un appelant sans
   * boutons de zoom (la mini-Terre de l'indice "Distance" du jeu Indices, toujours "revelee") peut
   * l'activer explicitement sans les boutons. */
  allowSatellite?: boolean;
};

export type Point = {
  x: number;
  y: number;
};

/** 1 = droite (cap vers l'est), -1 = gauche (cap vers l'ouest). */
export type Side = 1 | -1;
