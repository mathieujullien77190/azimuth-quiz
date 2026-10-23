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
};

export type Point = {
  x: number;
  y: number;
};

/** 1 = droite (cap est), -1 = gauche (cap ouest). */
export type Side = 1 | -1;
