import {
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  DirectionalLight,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineLoop,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

import { rhumbDestination } from '@/helpers/geo';
import type { Coordinates } from '@/types';

import {
  AMBIENT_LIGHT,
  DOT_SEGMENTS,
  GUIDE_ALTITUDE,
  GUIDE_DASH,
  GUIDE_GAP,
  GUIDE_STEP,
  HEADLIGHT,
  HEADLIGHT_POSITION,
  LAND_ALTITUDE,
  MARK_ALTITUDE,
  MARK_DOT,
  ORIGIN_DOT,
  POLE_DOT,
  ROUTE_ALTITUDE,
  ROUTE_SIDES,
  ROUTE_STEPS,
  ROUTE_THICKNESS,
  SPHERE_SEGMENTS,
  TRUTH_RING,
  TRUTH_RING_THICKNESS,
} from './constants';
import { GLOBE_LAND_PATH } from './globeLand';
import {
  equatorPoints,
  greenwichPoints,
  parseRings,
  polylinePositions,
  routePoints,
  scenePoint,
} from './helpers';
import type { GlobeScene, GlobeSceneInput } from './types';

/** Read once: the world's outline never changes. */
const LAND_RINGS = parseRings(GLOBE_LAND_PATH);

/** A line (open or closed) through places, drawn at `altitude` above the ball. */
const polyline = (points: Coordinates[], altitude: number, material: Material, closed: boolean): Line => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(polylinePositions(points, altitude), 3));
  const line = closed ? new LineLoop(geometry, material) : new Line(geometry, material);
  // Dashes are measured along the line, so it has to know its own length.
  line.computeLineDistances();
  return line;
};

/** A dot sitting on the ball at `point`. */
const dot = (point: Coordinates, radius: number, altitude: number, color: string): Mesh => {
  const mesh = new Mesh(
    new SphereGeometry(radius, DOT_SEGMENTS, DOT_SEGMENTS / 2),
    new MeshBasicMaterial({ color }),
  );
  mesh.position.set(...scenePoint(point, altitude));
  return mesh;
};

/** The ring around the true answer: a flat circle laid on the ball, facing the viewer like a target. */
const ring = (point: Coordinates, color: string): Mesh => {
  const mesh = new Mesh(
    new TorusGeometry(TRUTH_RING, TRUTH_RING_THICKNESS, 8, DOT_SEGMENTS * 2),
    new MeshBasicMaterial({ color }),
  );
  mesh.position.set(...scenePoint(point, MARK_ALTITUDE));
  // A torus lies in its own x/y plane, around its z axis: pointing that axis at the middle of the globe lays the ring
  // flat on the ground.
  mesh.lookAt(0, 0, 0);
  return mesh;
};

/** An answer's route, as a tube thick enough to be seen (a line would be one pixel wide on most devices). */
const routeTube = (origin: Coordinates, bearing: number, distanceKm: number, color: string, opacity: number): Mesh => {
  const curve = new CatmullRomCurve3(
    routePoints(origin, bearing, distanceKm, ROUTE_STEPS).map((point) => new Vector3(...scenePoint(point, ROUTE_ALTITUDE))),
  );
  return new Mesh(
    new TubeGeometry(curve, ROUTE_STEPS, ROUTE_THICKNESS, ROUTE_SIDES, false),
    new MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
  );
};

/**
 * The whole globe as three.js objects: the ball, the world's outline, the guides, the starting point, and every answer
 * as its route and its end point (the true one only as a circled point, as on the Earth seen from the side). Nothing
 * here knows about the screen: what is in front and what is hidden behind the ball is the depth buffer's business, not
 * ours — which is the whole point of drawing it in 3D.
 *
 * The lamp comes back out with the scene (`headlight`) instead of being added to it: the caller hangs it on the camera,
 * so the same side of the ball always catches the light however the globe is turned.
 */
export const buildGlobeScene = ({ origin, marks, land, equator, greenwich, north, colors }: GlobeSceneInput): GlobeScene => {
  const scene = new Scene();

  scene.add(
    new Mesh(
      new SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2),
      new MeshLambertMaterial({ color: colors.globe }),
    ),
  );
  scene.add(new AmbientLight(0xffffff, AMBIENT_LIGHT));
  const headlight = new DirectionalLight(0xffffff, HEADLIGHT);
  headlight.position.set(...HEADLIGHT_POSITION);

  if (land) {
    const material = new LineBasicMaterial({ color: colors.land });
    LAND_RINGS.forEach((coastline) => scene.add(polyline(coastline, LAND_ALTITUDE, material, true)));
  }

  const guide = () => new LineDashedMaterial({ color: colors.guide, dashSize: GUIDE_DASH, gapSize: GUIDE_GAP });
  if (equator) scene.add(polyline(equatorPoints(GUIDE_STEP), GUIDE_ALTITUDE, guide(), true));
  if (greenwich) scene.add(polyline(greenwichPoints(GUIDE_STEP), GUIDE_ALTITUDE, guide(), false));

  marks.forEach((mark) => {
    const end = rhumbDestination(origin, mark.bearing, mark.distanceKm);
    if (mark.isTruth !== true) scene.add(routeTube(origin, mark.bearing, mark.distanceKm, mark.color, mark.opacity ?? 1));
    scene.add(dot(end, MARK_DOT, MARK_ALTITUDE, mark.color));
    if (mark.isTruth === true) scene.add(ring(end, mark.color));
  });

  scene.add(dot(origin, ORIGIN_DOT, MARK_ALTITUDE, colors.origin));
  if (north) scene.add(dot({ latitude: 90, longitude: 0 }, POLE_DOT, MARK_ALTITUDE, colors.pole));

  return { scene, headlight };
};

/** Hands the ball's geometries and materials back to the graphics card: a new scene is built whenever an answer, the
 * theme or the stage of a clue changes, and the old one would otherwise stay there taking up memory. */
export const disposeScene = (scene: Scene): void => {
  scene.traverse((object) => {
    const drawn = object as Partial<Mesh>;
    drawn.geometry?.dispose();
    const material = drawn.material;
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
    else material?.dispose();
  });
  scene.clear();
};
