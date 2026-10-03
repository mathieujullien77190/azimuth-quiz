import { EARTH_RADIUS_KM } from '@/data';
import { rhumbDestination, wrapLongitude } from '@/helpers/geo';
import type { Coordinates } from '@/types';

import { MAX_CENTER_LATITUDE, MAX_ZOOM, MIN_ZOOM } from './constants';
import type { ScreenPoint, ViewPoint } from './types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Where you end up going `distanceKm` along the great circle (the shortest way, whose heading drifts as you go) that
 * leaves `origin` on `bearing`. Only the satellite flies it: an answer follows its constant heading (`routePoints`),
 * but a constant heading spirals into a pole instead of going right round the Earth. */
export const greatCirclePoint = (origin: Coordinates, bearing: number, distanceKm: number): Coordinates => {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const theta = toRadians(bearing);
  const lat1 = toRadians(origin.latitude);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(theta));
  const lon2 =
    toRadians(origin.longitude) +
    Math.atan2(
      Math.sin(theta) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { latitude: toDegrees(lat2), longitude: wrapLongitude(toDegrees(lon2)) };
};

/** The route of an answer: `distanceKm` from `origin` holding `bearing` all the way (the rhumb line, see `@/helpers/geo`),
 * as `steps + 1` points (the first one is the origin). A straight line on a Mercator map, a curve on the globe. */
export const routePoints = (origin: Coordinates, bearing: number, distanceKm: number, steps: number): Coordinates[] =>
  Array.from({ length: steps + 1 }, (_, index) => rhumbDestination(origin, bearing, (distanceKm * index) / steps));

/** The land outline (`M lon lat L lon lat ... Z` per ring) as rings of coordinates. */
export const parseRings = (path: string): Coordinates[][] =>
  path
    .split('M')
    .filter((ring) => ring !== '')
    .map((ring) =>
      ring
        .replace('Z', '')
        .split('L')
        .map((pair) => {
          const [longitude, latitude] = pair.split(' ').map(Number);
          return { latitude, longitude };
        }),
    );

/**
 * Where a place sits in the scene: the globe is a ball of radius 1 (times `altitude`) around the middle of the scene,
 * the north pole towards +y and the Greenwich meridian towards +z — the side the camera faces when the globe shows
 * (0, 0). Three numbers in a row, the way three.js wants them.
 */
export const scenePoint = (point: Coordinates, altitude = 1): [number, number, number] => {
  const lat = toRadians(point.latitude);
  const lon = toRadians(point.longitude);
  return [
    altitude * Math.cos(lat) * Math.sin(lon),
    altitude * Math.sin(lat),
    altitude * Math.cos(lat) * Math.cos(lon),
  ];
};

/** A line of places as the flat list of their coordinates in the scene, ready for a three.js buffer. */
export const polylinePositions = (points: Coordinates[], altitude: number): number[] =>
  points.flatMap((point) => scenePoint(point, altitude));

/** Where a point is when the globe is turned to show `center` in the middle (orthographic projection, unit sphere):
 * the camera's own point of view, used to place what is drawn over the canvas (labels, satellite). */
export const viewPoint = (point: Coordinates, center: Coordinates): ViewPoint => {
  const lat = toRadians(point.latitude);
  const lat0 = toRadians(center.latitude);
  const dLon = toRadians(point.longitude - center.longitude);
  return {
    x: Math.cos(lat) * Math.sin(dLon),
    y: Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(dLon),
    z: Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(dLon),
  };
};

/** Back to the outline of the globe: what is on the far side is pushed to the edge, along the same direction. */
const onLimb = (x: number, y: number): { x: number; y: number } => {
  const length = Math.max(Math.hypot(x, y), 1e-12);
  return { x: x / length, y: y / length };
};

/** A point on the drawing, the globe being a circle of `radius` around (`cx`, `cy`). */
export const screenPoint = (
  point: Coordinates,
  center: Coordinates,
  cx: number,
  cy: number,
  radius: number,
): ScreenPoint => {
  const view = viewPoint(point, center);
  const visible = view.z >= 0;
  const { x, y } = visible ? view : onLimb(view.x, view.y);
  return { x: cx + x * radius, y: cy - y * radius, visible };
};

/** The point to show in the middle so that all `points` are as visible as possible: the mean direction of the points. A
 * set that cancels out (two opposite points) falls back on the first one. */
export const centerOn = (points: Coordinates[]): Coordinates => {
  const sum = points.reduce(
    (total, point) => {
      const lat = toRadians(point.latitude);
      const lon = toRadians(point.longitude);
      return {
        x: total.x + Math.cos(lat) * Math.cos(lon),
        y: total.y + Math.cos(lat) * Math.sin(lon),
        z: total.z + Math.sin(lat),
      };
    },
    { x: 0, y: 0, z: 0 },
  );
  const length = Math.hypot(sum.x, sum.y, sum.z);
  if (length < 1e-6) return points[0];
  return { latitude: toDegrees(Math.asin(sum.z / length)), longitude: toDegrees(Math.atan2(sum.y, sum.x)) };
};

/** The new centre after the finger moved by (`dx`, `dy`) pixels on a globe of `radius`: the surface follows the finger,
 * so the centre goes the other way. The latitude is kept short of the poles, so north stays up. */
export const dragCenter = (center: Coordinates, dx: number, dy: number, radius: number): Coordinates => {
  const degrees = toDegrees(1 / radius);
  const latitude = Math.max(-MAX_CENTER_LATITUDE, Math.min(MAX_CENTER_LATITUDE, center.latitude + dy * degrees));
  return { latitude, longitude: center.longitude - dx * degrees };
};

/** The zoom multiplied by `factor` (a press on +, or how much two fingers spread), kept within the limits. */
export const zoomedBy = (zoom: number, factor: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));

/** How far apart two fingers are, to zoom by pinching; `null` with fewer than two of them on the glass. */
export const fingerGap = (touches: { pageX: number; pageY: number }[]): number | null =>
  touches.length < 2 ? null : Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

/** Where a satellite flying at `ratio` times the radius is on the drawing, `angle` radians along the great circle that
 * leaves `origin` on `bearing` (so it does go right round the Earth, see `greatCirclePoint`). It is seen when it is in
 * front of the globe or, behind it, when it is out of the way of the globe (beyond its outline). */
export const orbitPoint = (
  origin: Coordinates,
  bearing: number,
  angle: number,
  center: Coordinates,
  cx: number,
  cy: number,
  radius: number,
  ratio: number,
): ScreenPoint => {
  const view = viewPoint(greatCirclePoint(origin, bearing, angle * EARTH_RADIUS_KM), center);
  return {
    x: cx + view.x * radius * ratio,
    y: cy - view.y * radius * ratio,
    visible: view.z >= 0 || Math.hypot(view.x, view.y) * ratio > 1,
  };
};

/** The equator, as points every `step` degrees of longitude. */
export const equatorPoints = (step: number): Coordinates[] =>
  Array.from({ length: Math.round(360 / step) + 1 }, (_, index) => ({ latitude: 0, longitude: -180 + index * step }));

/** The Greenwich meridian (longitude 0), as points every `step` degrees of latitude, pole to pole. */
export const greenwichPoints = (step: number): Coordinates[] =>
  Array.from({ length: Math.round(180 / step) + 1 }, (_, index) => ({ latitude: -90 + index * step, longitude: 0 }));
