import type { DistanceMode } from '@/types';

/** Une reponse a dessiner sur la Terre. */
export type EarthMark = {
  bearing: number;
  /** En km : distance sur la surface (mode 'surface') ou en ligne droite (mode 'straight'). */
  distanceKm: number;
  /** Angle sous l'horizon, en degres (utilise seulement en mode 'straight'). */
  inclination: number;
  color: string;
  /** Reponses des autres joueurs pendant que le joueur courant repond : estompees. */
  opacity?: number;
  /** Vraie reponse : cerclee, et declenche le zoom. */
  isTruth?: boolean;
};

export type EarthSectionProps = {
  size: number;
  /** Un seul schema = un seul mode : arc (surface) ou droite (ligne droite). */
  mode: DistanceMode;
  marks: EarthMark[];
};

export type Point = {
  x: number;
  y: number;
};

/** 1 = droite (cap vers l'est), -1 = gauche (cap vers l'ouest). */
export type Side = 1 | -1;
