import { EARTH_RADIUS_KM } from '@/constants';
import type { DistanceMode } from '@/types';

import { MAX_ZOOM, ZOOM_STEPS } from './constants';
import type { EarthMark, Point, Side } from './types';

/** Cote du schema : un cap vers l'ouest (270° +/- 90°) part a gauche, sinon a droite. */
export const sideOf = (bearing: number): Side => (Math.sin((bearing * Math.PI) / 180) < 0 ? -1 : 1);

/** Point du cercle a `angle` radians du sommet (le joueur) ; angle positif = droite, negatif = gauche. */
export const surfacePoint = (center: Point, radius: number, angle: number): Point => ({
  x: center.x + radius * Math.sin(angle),
  y: center.y - radius * Math.cos(angle),
});

/** Angle au centre correspondant a une distance mesuree sur la surface. */
export const surfaceAngle = (distanceKm: number): number => Math.min(Math.PI, distanceKm / EARTH_RADIUS_KM);

/** Arc de cercle du sommet jusqu'a `angle` radians, du cote `side` (attribut `d` d'un <Path>). */
export const arcPath = (center: Point, radius: number, angle: number, side: Side): string => {
  const start = surfacePoint(center, radius, 0);
  const end = surfacePoint(center, radius, side * angle);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} ${side === 1 ? 1 : 0} ${end.x} ${end.y}`;
};

export type MarkGeometry = {
  shape: 'arc' | 'line';
  side: Side;
  /** Extremite de la reponse (la ou on pose le point). */
  end: Point;
  /** Angle au centre de l'arc (forme 'arc' seulement). */
  angle: number;
};

type GeometryInput = {
  item: Pick<EarthMark, 'bearing' | 'distanceKm' | 'inclination'>;
  mode: DistanceMode;
  /** Position du joueur : le sommet du cercle. */
  player: Point;
  radius: number;
};

/**
 * Dessin d'une reponse, selon le mode du schema :
 * - surface : un arc le long du cercle, de longueur = la distance ;
 * - straight : une droite qui part avec l'inclinaison choisie (sa longueur en decoule).
 */
export const markGeometry = ({ item, mode, player, radius }: GeometryInput): MarkGeometry => {
  const side = sideOf(item.bearing);

  if (mode === 'surface') {
    const angle = surfaceAngle(item.distanceKm);
    const center = { x: player.x, y: player.y + radius };
    return { shape: 'arc', side, angle, end: surfacePoint(center, radius, side * angle) };
  }

  const inclination = (item.inclination * Math.PI) / 180;
  const length = (item.distanceKm * radius) / EARTH_RADIUS_KM;
  return {
    shape: 'line',
    side,
    angle: 0,
    end: { x: player.x + side * length * Math.cos(inclination), y: player.y + length * Math.sin(inclination) },
  };
};

/**
 * Plus fort zoom (parmi ZOOM_STEPS) qui garde toutes les extremites dans la zone visible.
 * `offsets` : extremites relatives au joueur, a l'echelle 1.
 */
export const fitZoom = (offsets: Point[], availableX: number, availableY: number): number => {
  const maxX = Math.max(1e-6, ...offsets.map((offset) => Math.abs(offset.x)));
  const maxY = Math.max(1e-6, ...offsets.map((offset) => Math.max(0, offset.y)));
  const limit = Math.min(MAX_ZOOM, availableX / maxX, availableY / maxY);
  return ZOOM_STEPS.filter((step) => step <= limit).pop() ?? 1;
};
