import {
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  DataTexture,
  DirectionalLight,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineLoop,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

import { rhumbDestination } from '@/helpers/geo';
import type { Coordinates } from '@/types';

import {
  AMBIENT_LIGHT,
  DOT_SEGMENTS,
  LAND_FILL_ALTITUDE,
  LAND_FILL_OPACITY,
  LAND_FILL_SEGMENTS,
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
import { GLOBE_MASK } from './globeMask';
import {
  equatorPoints,
  greenwichPoints,
  parseRings,
  polylinePositions,
  routePoints,
  scenePoint,
} from './helpers';
import type { GlobeScene, GlobeSceneInput } from './types';

/**
 * The world's coastlines as one flat list of segment ends, worked out the first time the globe is drawn with the land
 * on (reading 800 coastlines out of the asset is not work to do at import time, for a ball that may never show them).
 * The outline never changes — only the colour it is drawn in — so it is kept for the next globe.
 */
let landSegments: number[] | null = null;

const worldSegments = (): number[] => {
  if (landSegments !== null) return landSegments;
  const built: number[] = [];
  parseRings(GLOBE_LAND_PATH).forEach((coastline) => {
    coastline.forEach((point, index) => {
      // A closed ring: the last point goes back to the first.
      built.push(...scenePoint(point, LAND_ALTITUDE), ...scenePoint(coastline[(index + 1) % coastline.length], LAND_ALTITUDE));
    });
  });
  landSegments = built;
  return built;
};

/**
 * The land/sea mask as a picture the shell below is painted with: one pixel per pixel of `GLOBE_MASK`, white and
 * opaque over land, nothing at all over the sea. The mask is run-length encoded (the lengths of the stretches of sea
 * and land, starting with sea), which unpacks in one pass; it is kept for the next globe, like the coastlines.
 */
let landPicture: Texture | null = null;

const landMask = (): Texture => {
  if (landPicture !== null) return landPicture;
  const { width, height, runs } = GLOBE_MASK;
  const pixels = new Uint8Array(width * height * 4);
  let pixel = 0;
  let land = false;
  for (const run of runs.split('.')) {
    const length = parseInt(run, 36);
    if (land) pixels.fill(255, pixel * 4, (pixel + length) * 4);
    pixel += length;
    land = !land;
  }
  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  // The map meets itself at the date line: without this, the last column would be smeared against the first.
  texture.wrapS = RepeatWrapping;
  texture.needsUpdate = true;
  landPicture = texture;
  return texture;
};

/**
 * The shell the continents are painted on: a ball of its own, a hair above the sea, carrying the mask as a picture. A
 * grid of its own too, so that each of its corners knows where it is on the map (`uv`) — the ball's own corners are
 * laid out by three.js in another order, and the point here is to be sure a coast falls on its coast.
 */
const landFill = (color: string): Mesh => {
  const columns = LAND_FILL_SEGMENTS;
  const rows = LAND_FILL_SEGMENTS / 2;
  const positions: number[] = [];
  const uvs: number[] = [];
  const corners: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const latitude = -90 + (row / rows) * 180;
    for (let column = 0; column <= columns; column += 1) {
      const longitude = -180 + (column / columns) * 360;
      positions.push(...scenePoint({ latitude, longitude }, LAND_FILL_ALTITUDE));
      uvs.push((longitude + 180) / 360, (latitude + 90) / 180);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const corner = row * (columns + 1) + column;
      const above = corner + columns + 1;
      corners.push(corner, above, corner + 1, above, above + 1, corner + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(corners);
  geometry.computeVertexNormals();
  return new Mesh(
    geometry,
    new MeshLambertMaterial({
      color,
      map: landMask(),
      transparent: true,
      opacity: LAND_FILL_OPACITY,
      // The sea below it is opaque anyway, and the coastline above must not be cut out by a see-through shell.
      depthWrite: false,
    }),
  );
};

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
 * so the same side of the ball always catches the light however the globe is turned. So do the dots (`screenSized`):
 * zoomed in, they are shrunk back to the size they have on screen unzoomed, or they would end up hiding the very map
 * one zoomed in to read (`markScale` in `useGlobeRenderer`).
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
    // The continents painted in, then their coast drawn over it: the colour comes from a picture of the world, the
    // sharp edge from the outline itself.
    scene.add(landFill(colors.land));
    // Every coast in one object: 800 coastlines of their own would be 800 draws for the graphics card, and the world
    // can be as detailed as the asset is without that changing.
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(worldSegments(), 3));
    scene.add(new LineSegments(geometry, new LineBasicMaterial({ color: colors.land })));
  }

  const guide = () => new LineDashedMaterial({ color: colors.guide, dashSize: GUIDE_DASH, gapSize: GUIDE_GAP });
  if (equator) scene.add(polyline(equatorPoints(GUIDE_STEP), GUIDE_ALTITUDE, guide(), true));
  if (greenwich) scene.add(polyline(greenwichPoints(GUIDE_STEP), GUIDE_ALTITUDE, guide(), false));

  // What the zoom must not blow up: the dots and the ring, not the ball or the routes.
  const screenSized: Mesh[] = [];
  const addMark = (mesh: Mesh) => {
    screenSized.push(mesh);
    scene.add(mesh);
  };

  marks.forEach((mark) => {
    const end = rhumbDestination(origin, mark.bearing, mark.distanceKm);
    if (mark.isTruth !== true) scene.add(routeTube(origin, mark.bearing, mark.distanceKm, mark.color, mark.opacity ?? 1));
    addMark(dot(end, MARK_DOT, MARK_ALTITUDE, mark.color));
    if (mark.isTruth === true) addMark(ring(end, mark.color));
  });

  addMark(dot(origin, ORIGIN_DOT, MARK_ALTITUDE, colors.origin));
  if (north) addMark(dot({ latitude: 90, longitude: 0 }, POLE_DOT, MARK_ALTITUDE, colors.pole));

  return { scene, headlight, screenSized };
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
