import { normalizeBearing } from '@/helpers';

import {
  CARDINAL_BEARINGS,
  HEADING_DEADBAND_DEG,
  HEADING_SMOOTHING,
  TICK_LENGTH_RATIO,
  TICK_OUTER_RATIO,
  TICK_STEP_DEG,
} from './constants';
import type { Point, Tick } from './types';

/** N/E/S/O(W) shown on the dial; only the west label depends on the language. */
export const cardinalPoints = (westLabel: string) => [
  { label: 'N', bearing: CARDINAL_BEARINGS.N },
  { label: 'E', bearing: CARDINAL_BEARINGS.E },
  { label: 'S', bearing: CARDINAL_BEARINGS.S },
  { label: westLabel, bearing: CARDINAL_BEARINGS.W },
];

/** Point at `radius` from the center in direction `bearing` (0 = up, clockwise). */
export const polarToPoint = (center: number, radius: number, bearing: number): Point => {
  const radians = (bearing * Math.PI) / 180;
  return { x: center + radius * Math.sin(radians), y: center - radius * Math.cos(radians) };
};

/** Heading (integer, [0, 360[) corresponding to a touch at (x, y) in a `size`-sided square. */
export const bearingFromTouch = (x: number, y: number, size: number): number => {
  const half = size / 2;
  const degrees = (Math.atan2(x - half, half - y) * 180) / Math.PI;
  return Math.round(normalizeBearing(degrees)) % 360;
};

/** Tapered diamond pointing toward `bearing`, in <Polygon>'s `points` format. */
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

/**
 * Smoothing for the sensor's heading (very jittery): advances by a fraction of the shortest path,
 * which handles the 359° -> 0° wraparound. Tiny variations are ignored.
 */
export const smoothHeading = (previous: number | null, next: number): number => {
  if (previous === null) return normalizeBearing(next);
  const delta = ((next - previous + 540) % 360) - 180;
  if (Math.abs(delta) < HEADING_DEADBAND_DEG) return previous;
  return normalizeBearing(previous + delta * HEADING_SMOOTHING);
};
