import type { Coordinates } from '@/types';

/** Une reponse a dessiner sur la Terre, en arc le long de la surface. */
export type EarthMark = {
  bearing: number;
  /** Distance de surface (longueur d'arc). */
  distanceKm: number;
  color: string;
  /** Reponses des autres joueurs pendant que le joueur courant repond : estompees. */
  opacity?: number;
  /** Vraie reponse : entouree, et declenche le zoom. */
  isTruth?: boolean;
};

export type EarthSectionProps = {
  size: number;
  /** Point de depart des reponses. Si donne, la Terre peut passer en globe 3D (`Globe3D`) ou chaque reponse est
   * sa route a cap constant : sans lui, rien a placer sur une carte. */
  origin?: Coordinates;
  marks: EarthMark[];
  /** Affiche les boutons +/- (revelation) : part du zoom ideal, descend jusqu'a 1 (Terre entiere). */
  zoomControls?: boolean;
  /** Autorise le satellite au zoom 1 independamment des boutons +/- : suit `zoomControls` par defaut, mais on
   * peut l'activer seul. */
  allowSatellite?: boolean;
  /** Force toutes les marques du meme cote (1 = droite) au lieu du cote reel de leur `bearing`
   * (ne reveler que la distance, pas la direction). */
  forceSide?: Side;
};

export type Point = {
  x: number;
  y: number;
};

/** 1 = droite (cap est), -1 = gauche (cap ouest). */
export type Side = 1 | -1;
