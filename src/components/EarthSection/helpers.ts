import { EARTH_RADIUS_KM } from '@/constants';

import { MAX_ZOOM, ZOOM_STEPS } from './constants';
import type { EarthMark, Point, Side } from './types';

/** Side of the diagram: a westward heading (270° +/- 90°) goes left, otherwise right. */
export const sideOf = (bearing: number): Side => (Math.sin((bearing * Math.PI) / 180) < 0 ? -1 : 1);

/** Point on the circle at `angle` radians from the apex (the player); positive angle = right, negative = left. */
export const surfacePoint = (center: Point, radius: number, angle: number): Point => ({
  x: center.x + radius * Math.sin(angle),
  y: center.y - radius * Math.cos(angle),
});

/** Central angle corresponding to a distance measured along the surface. */
export const surfaceAngle = (distanceKm: number): number => Math.min(Math.PI, distanceKm / EARTH_RADIUS_KM);

/** Circle arc from the apex to `angle` radians, on the `side` side (`d` attribute of a <Path>). */
export const arcPath = (center: Point, radius: number, angle: number, side: Side): string => {
  const start = surfacePoint(center, radius, 0);
  const end = surfacePoint(center, radius, side * angle);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} ${side === 1 ? 1 : 0} ${end.x} ${end.y}`;
};

/**
 * Endpoint of an answer on the circle: the arc (surface) and the chord (straight line) connect the
 * same two points, so they share this endpoint - only the chosen inclination sets the distance.
 */
export const markEnd = (
  item: Pick<EarthMark, 'bearing' | 'distanceKm'>,
  center: Point,
  radius: number,
  forceSide?: Side,
): Point => surfacePoint(center, radius, (forceSide ?? sideOf(item.bearing)) * surfaceAngle(item.distanceKm));

/**
 * Highest zoom (among ZOOM_STEPS) that keeps all endpoints within the visible zone.
 * `offsets`: endpoints relative to the player, at scale 1.
 */
export const fitZoom = (offsets: Point[], availableX: number, availableY: number): number => {
  const maxX = Math.max(1e-6, ...offsets.map((offset) => Math.abs(offset.x)));
  const maxY = Math.max(1e-6, ...offsets.map((offset) => Math.max(0, offset.y)));
  const limit = Math.min(MAX_ZOOM, availableX / maxX, availableY / maxY);
  return ZOOM_STEPS.filter((step) => step <= limit).pop() ?? 1;
};
