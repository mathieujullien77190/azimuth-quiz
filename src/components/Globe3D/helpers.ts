import { EARTH_RADIUS_KM } from '@/data';
import type { Coordinates } from '@/types';

import { MAX_CENTER_LATITUDE } from './constants';
import type { ScreenPoint, ViewPoint } from './types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** A longitude brought back into [-180, 180[. */
export const wrapLongitude = (longitude: number): number => ((((longitude + 180) % 360) + 360) % 360) - 180;

/** Where you end up going `distanceKm` along the surface from `origin`, keeping the initial `bearing` (degrees, 0 = north):
 * the standard spherical "destination point" formula. */
export const destinationPoint = (origin: Coordinates, bearing: number, distanceKm: number): Coordinates => {
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

/** The great circle from `origin` along `bearing` for `distanceKm`, as `steps + 1` points (the first one is the origin).
 * The shortest way between two places, the curve of long flights. */
export const routePoints = (origin: Coordinates, bearing: number, distanceKm: number, steps: number): Coordinates[] =>
  Array.from({ length: steps + 1 }, (_, index) => destinationPoint(origin, bearing, (distanceKm * index) / steps));

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

/** Where a point is when the globe is turned to show `center` in the middle (orthographic projection, unit sphere). */
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

/** Where the segment between a visible point and a hidden one crosses the outline of the globe. */
const limbCrossing = (from: ViewPoint, to: ViewPoint): { x: number; y: number } => {
  const t = from.z / (from.z - to.z);
  return onLimb(from.x + t * (to.x - from.x), from.y + t * (to.y - from.y));
};

/** The angle of a point around the middle of the globe, as seen on the drawing. */
const angleOf = (point: { x: number; y: number }): number => Math.atan2(point.y, point.x);

const TURN = 2 * Math.PI;

/** How far one has to turn counter-clockwise to go from an angle to another, in [0, 2 pi[. */
const turnBetween = (from: number, to: number): number => (((to - from) % TURN) + TURN) % TURN;

/** True when the ring goes counter-clockwise (the land is on the left of the way), on the map as on the globe seen from
 * outside. Longitudes are followed continuously, so a ring across the date line is not mistaken for one around the world. */
const isCounterClockwise = (ring: Coordinates[]): boolean => {
  let longitude = ring[0].longitude;
  const xs = ring.map((point, index) => {
    if (index > 0) longitude += wrapLongitude(point.longitude - ring[index - 1].longitude);
    return longitude;
  });
  const area = xs.reduce((total, x, index) => {
    const next = (index + 1) % ring.length;
    return total + x * ring[next].latitude - xs[next] * ring[index].latitude;
  }, 0);
  return area > 0;
};

/** `d` attribute of the land. A ring is cut exactly at the outline where it goes behind the globe: what stays in front
 * is a few stretches of coast, each from where it comes out from behind to where it goes back. They are joined by arcs of
 * the outline, every stretch ending on the next one met going round the globe in the direction that keeps the land on
 * the same side as along the coast (so a continent cut by the horizon fills up to the edge, not along a chord through
 * the globe, and not the sea instead). A ring fully behind the globe is skipped. */
export const landPath = (
  rings: Coordinates[][],
  center: Coordinates,
  cx: number,
  cy: number,
  radius: number,
): string => {
  const at = (point: { x: number; y: number }) =>
    `${(cx + point.x * radius).toFixed(1)} ${(cy - point.y * radius).toFixed(1)}`;
  let path = '';
  for (const ring of rings) {
    const views = ring.map((point) => viewPoint(point, center));
    if (!views.some((view) => view.z >= 0)) continue;
    const count = views.length;
    // Start where the ring comes out from behind, so that the walk begins at the start of a stretch of coast.
    const hidden = views.findIndex((view, index) => view.z < 0 && views[(index + 1) % count].z >= 0);
    if (hidden === -1) {
      path += `${views.map((view, index) => `${index === 0 ? 'M' : 'L'}${at(view)}`).join('')}Z`;
      continue;
    }
    const walk = [...views.slice(hidden + 1), ...views.slice(0, hidden + 1)];
    const stretches: { entry: { x: number; y: number }; exit: { x: number; y: number }; coast: string }[] = [];
    let entry = { x: 0, y: 0 };
    let coast = '';
    walk.forEach((view, index) => {
      const previous = walk[(index + count - 1) % count];
      if (view.z >= 0) {
        if (previous.z < 0) {
          entry = limbCrossing(view, previous);
          coast = '';
        }
        coast += `L${at(view)}`;
      } else if (previous.z >= 0) {
        const exit = limbCrossing(previous, view);
        stretches.push({ entry, exit, coast: `${coast}L${at(exit)}` });
      }
    });

    const counterClockwise = isCounterClockwise(ring);
    const used = new Set<number>();
    stretches.forEach((_, first) => {
      if (used.has(first)) return;
      used.add(first);
      let d = `M${at(stretches[first].entry)}${stretches[first].coast}`;
      let current = first;
      for (;;) {
        const left = angleOf(stretches[current].exit);
        // The next stretch met along the outline, going the way the ring turns (the first one included: it closes the shape).
        const next = stretches
          .map((stretch, index) => ({
            index,
            turn: counterClockwise
              ? turnBetween(left, angleOf(stretch.entry))
              : turnBetween(angleOf(stretch.entry), left),
          }))
          .filter(({ index }) => !used.has(index) || index === first)
          .reduce((best, candidate) => (candidate.turn < best.turn ? candidate : best));
        // Counter-clockwise on the globe is sweep 0 once the drawing is flipped (y down).
        d += `A${radius} ${radius} 0 ${next.turn > Math.PI ? 1 : 0} ${counterClockwise ? 0 : 1} ${at(stretches[next.index].entry)}`;
        if (next.index === first) break;
        used.add(next.index);
        d += stretches[next.index].coast;
        current = next.index;
      }
      path += `${d}Z`;
    });
  }
  return path;
};

/** The visible parts of a route, each as a `d` attribute: where the route goes behind the globe it is cut exactly at the
 * outline, and starts again where it comes back. */
export const routePaths = (
  points: Coordinates[],
  center: Coordinates,
  cx: number,
  cy: number,
  radius: number,
): string[] => {
  const views = points.map((point) => viewPoint(point, center));
  const paths: string[] = [];
  let current = '';
  const at = (x: number, y: number) => `${cx + x * radius} ${cy - y * radius}`;
  const flush = () => {
    if (current !== '') paths.push(current.trim());
    current = '';
  };
  views.forEach((view, index) => {
    const previous = views[index - 1];
    if (view.z >= 0) {
      if (previous !== undefined && previous.z < 0) {
        const t = previous.z / (previous.z - view.z);
        const edge = onLimb(previous.x + t * (view.x - previous.x), previous.y + t * (view.y - previous.y));
        current += `M ${at(edge.x, edge.y)} `;
      }
      current += `${current === '' ? 'M' : 'L'} ${at(view.x, view.y)} `;
    } else if (previous !== undefined && previous.z >= 0) {
      const t = previous.z / (previous.z - view.z);
      const edge = onLimb(previous.x + t * (view.x - previous.x), previous.y + t * (view.y - previous.y));
      current += `L ${at(edge.x, edge.y)} `;
      flush();
    }
  });
  flush();
  return paths;
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
 * so the centre goes the other way. The latitude is kept short of the poles. */
export const dragCenter = (center: Coordinates, dx: number, dy: number, radius: number): Coordinates => {
  const degrees = toDegrees(1 / radius);
  const latitude = Math.max(-MAX_CENTER_LATITUDE, Math.min(MAX_CENTER_LATITUDE, center.latitude + dy * degrees));
  return { latitude, longitude: center.longitude - dx * degrees };
};

/** Where a satellite flying at `ratio` times the radius is on the drawing, `angle` radians along the great circle that
 * leaves `origin` on `bearing`. It is seen when it is in front of the globe or, behind it, when it is out of the way
 * of the globe (beyond its outline). */
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
  const view = viewPoint(destinationPoint(origin, bearing, angle * EARTH_RADIUS_KM), center);
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
