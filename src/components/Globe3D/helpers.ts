import { rhumbDestination, wrapLongitude } from '@/helpers/geo';
import type { Coordinates } from '@/types';

import { MAX_CENTER_LATITUDE, MAX_ZOOM, MIN_ZOOM } from './constants';
import type { Fingers, ScreenPoint, ViewPoint } from './types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Route d'une reponse : `distanceKm` depuis `origin` en tenant `bearing` (loxodromie, voir `@/helpers/geo`),
 * en `steps + 1` points (le premier est l'origine). Droite sur une carte de Mercator, courbe sur le globe. */
export const routePoints = (origin: Coordinates, bearing: number, distanceKm: number, steps: number): Coordinates[] =>
  Array.from({ length: steps + 1 }, (_, index) => rhumbDestination(origin, bearing, (distanceKm * index) / steps));

/** Le contour des terres (`M lon lat L lon lat ... Z` par anneau) en anneaux de coordonnees. */
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
 * Position d'un lieu dans la scene : la boule a un rayon de 1 (fois `altitude`) autour du centre, pole nord vers +y,
 * meridien de Greenwich vers +z (le cote que regarde la camera quand le globe montre (0, 0)). Trois nombres
 * a la suite, comme three.js les veut.
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

/** Une ligne de lieux en liste plate de coordonnees de scene, pour un buffer three.js. */
export const polylinePositions = (points: Coordinates[], altitude: number): number[] =>
  points.flatMap((point) => scenePoint(point, altitude));

/** Ou est un point quand le globe est tourne pour montrer `center` au milieu (projection orthographique, sphere
 * unite) : le point de vue de la camera, pour placer ce qui est dessine sur le canvas (labels, satellite). */
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

/** Ramene au contour du globe : ce qui est de l'autre cote est pousse au bord, dans la meme direction. */
const onLimb = (x: number, y: number): { x: number; y: number } => {
  const length = Math.max(Math.hypot(x, y), 1e-12);
  return { x: x / length, y: y / length };
};

/** Un point du dessin, le globe etant un cercle de `radius` autour de (`cx`, `cy`). */
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

/** Le point a montrer au milieu pour que tous les `points` soient au mieux visibles : la direction moyenne. Un
 * ensemble qui s'annule (deux points opposes) retombe sur le premier. */
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

/** Nouveau centre apres un deplacement du doigt de (`dx`, `dy`) pixels sur un globe de `radius` : la surface suit le
 * doigt, donc le centre va dans l'autre sens. La latitude reste courte des poles, pour que le nord reste en haut. */
export const dragCenter = (center: Coordinates, dx: number, dy: number, radius: number): Coordinates => {
  const degrees = toDegrees(1 / radius);
  const latitude = Math.max(-MAX_CENTER_LATITUDE, Math.min(MAX_CENTER_LATITUDE, center.latitude + dy * degrees));
  return { latitude, longitude: center.longitude - dx * degrees };
};

/** Le zoom multiplie par `factor` (un appui sur +, ou l'ecartement de deux doigts), borne aux limites. */
export const zoomedBy = (zoom: number, factor: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));

/** Ecartement de deux doigts, pour zoomer au pincement ; `null` avec moins de deux doigts sur la vitre. */
export const fingerGap = (touches: { pageX: number; pageY: number }[]): number | null =>
  touches.length < 2 ? null : Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

/** Ou sont les doigts a l'ecran maintenant : celui qui a bouge, et l'ecartement de deux. Positions absolues, ce qui
 * permet qu'un tour ou un pincement soit le seul pas depuis le move precedent (voir `Globe3D`). */
export const fingersOf = (event: {
  pageX: number;
  pageY: number;
  touches: { pageX: number; pageY: number }[];
}): Fingers => ({ x: event.pageX, y: event.pageY, gap: fingerGap(event.touches) });

/**
 * Ou est a l'ecran un satellite a `ratio` fois le rayon, `angle` radians dans son orbite : tout autour de l'equateur,
 * vers l'est, un peu au-dessus du sol. Il tourne avec le globe (equateur vu du point de vue de la camera, voir
 * `viewPoint`) : devant la boule il la traverse, derriere le globe le cache, sauf au-dela du contour. Globe tourne
 * sur l'equateur, l'orbite est vue de profil, une ligne ; pencher le globe l'ouvre en ellipse.
 */
export const orbitPoint = (
  angle: number,
  center: Coordinates,
  cx: number,
  cy: number,
  radius: number,
  ratio: number,
): ScreenPoint => {
  const view = viewPoint({ latitude: 0, longitude: wrapLongitude(toDegrees(angle)) }, center);
  return {
    x: cx + view.x * radius * ratio,
    y: cy - view.y * radius * ratio,
    visible: view.z >= 0 || Math.hypot(view.x, view.y) * ratio > 1,
  };
};

/** L'equateur, en points tous les `step` degres de longitude. */
export const equatorPoints = (step: number): Coordinates[] =>
  Array.from({ length: Math.round(360 / step) + 1 }, (_, index) => ({ latitude: 0, longitude: -180 + index * step }));

/** Le meridien de Greenwich (longitude 0), en points tous les `step` degres de latitude, d'un pole a l'autre. */
export const greenwichPoints = (step: number): Coordinates[] =>
  Array.from({ length: Math.round(180 / step) + 1 }, (_, index) => ({ latitude: -90 + index * step, longitude: 0 }));
