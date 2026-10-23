import { EARTH_RADIUS_KM } from '@/data';

import { MAX_ZOOM, ZOOM_STEPS } from './constants';
import type { EarthMark, Point, Side } from './types';

/** Cote du schema : un cap vers l'ouest (270° +/- 90°) va a gauche, sinon a droite. */
export const sideOf = (bearing: number): Side => (Math.sin((bearing * Math.PI) / 180) < 0 ? -1 : 1);

/** Point du cercle a `angle` radians du sommet (le joueur) ; angle positif = droite, negatif = gauche. */
export const surfacePoint = (center: Point, radius: number, angle: number): Point => ({
  x: center.x + radius * Math.sin(angle),
  y: center.y - radius * Math.cos(angle),
});

/** Angle au centre d'une distance de surface. Une route a cap constant (voir `helpers/geo`) peut depasser un
 * demi-tour de Terre : elle s'arrete alors au point le plus eloigne du profil. */
export const surfaceAngle = (distanceKm: number): number => Math.min(Math.PI, distanceKm / EARTH_RADIUS_KM);

/** Arc de cercle du sommet a `angle` radians, du cote `side` (attribut `d` d'un <Path>). */
export const arcPath = (center: Point, radius: number, angle: number, side: Side): string => {
  const start = surfacePoint(center, radius, 0);
  const end = surfacePoint(center, radius, side * angle);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} ${side === 1 ? 1 : 0} ${end.x} ${end.y}`;
};

/** Point d'arrivee d'une reponse sur le cercle (fin de son arc). */
export const markEnd = (
  item: Pick<EarthMark, 'bearing' | 'distanceKm'>,
  center: Point,
  radius: number,
  forceSide?: Side,
): Point => surfacePoint(center, radius, (forceSide ?? sideOf(item.bearing)) * surfaceAngle(item.distanceKm));

/**
 * Plus grand zoom (parmi ZOOM_STEPS) qui garde tous les points dans la zone visible.
 * `offsets` : points relatifs au joueur, a l'echelle 1.
 */
export const fitZoom = (offsets: Point[], availableX: number, availableY: number): number => {
  const maxX = Math.max(1e-6, ...offsets.map((offset) => Math.abs(offset.x)));
  const maxY = Math.max(1e-6, ...offsets.map((offset) => Math.max(0, offset.y)));
  const limit = Math.min(MAX_ZOOM, availableX / maxX, availableY / maxY);
  return ZOOM_STEPS.filter((step) => step <= limit).pop() ?? 1;
};
