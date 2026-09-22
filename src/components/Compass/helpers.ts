import { normalizeBearing } from '@/helpers';

import { TICK_LENGTH_RATIO, TICK_OUTER_RATIO, TICK_STEP_DEG } from './constants';
import type { Point, Tick } from './types';

/** Point a `radius` du centre dans la direction `bearing` (0 = haut, sens horaire). */
export const polarToPoint = (center: number, radius: number, bearing: number): Point => {
  const radians = (bearing * Math.PI) / 180;
  return { x: center + radius * Math.sin(radians), y: center - radius * Math.cos(radians) };
};

/** Cap (entier, [0, 360[) correspondant a un toucher a (x, y) dans un carre de cote `size`. */
export const bearingFromTouch = (x: number, y: number, size: number): number => {
  const half = size / 2;
  const degrees = (Math.atan2(x - half, half - y) * 180) / Math.PI;
  return Math.round(normalizeBearing(degrees)) % 360;
};

/** Losange effile pointant vers `bearing`, au format `points` de <Polygon>. */
export const needlePoints = (
  center: number,
  bearing: number,
  length: number,
  tail: number,
  halfWidth: number,
): string =>
  [
    polarToPoint(center, length, bearing),
    polarToPoint(center, halfWidth, bearing + 90),
    polarToPoint(center, tail, bearing + 180),
    polarToPoint(center, halfWidth, bearing - 90),
  ]
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');

export const buildTicks = (size: number): Tick[] => {
  const center = size / 2;
  const outer = (size / 2) * TICK_OUTER_RATIO;

  return Array.from({ length: 360 / TICK_STEP_DEG }, (_, index) => {
    const bearing = index * TICK_STEP_DEG;
    const kind = bearing % 90 === 0 ? 'cardinal' : bearing % 45 === 0 ? 'intercardinal' : 'minor';
    const length = (size / 2) * TICK_LENGTH_RATIO[kind];
    return {
      key: String(bearing),
      from: polarToPoint(center, outer, bearing),
      to: polarToPoint(center, outer - length, bearing),
      kind,
    };
  });
};
