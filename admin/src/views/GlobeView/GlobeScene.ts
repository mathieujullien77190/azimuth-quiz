import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLOBE_LAND_PATH } from '@/components/Globe3D/globeLand';

import {
  CAMERA_DISTANCE,
  CAMERA_FOV,
  CAMERA_NEAR,
  FLY_DISTANCE,
  FLY_MS,
  GLOBE_RADIUS,
  HOME_VIEW,
  HOVER_COLOR,
  LAND_ALTITUDE,
  LAND_LINE_COLOR,
  MARK_SIZE,
  MAX_DISTANCE,
  MIN_DISTANCE,
  PICK_RADIUS_PX,
  PLACE_SIZES,
  SEA_COLOR,
  SPRITE_ALPHA_TEST,
  SPRITE_SIZE,
  SELECTED_COLOR,
  STAR_COLOR,
  STAR_COUNT,
  STAR_RADIUS,
  STAR_SEED,
  STAR_SIZE,
} from './constants';
import {
  drawShape,
  labelsShownAt,
  maxLabelsAt,
  nearestPoint,
  parseRings,
  PLACE_SHAPES,
  rotateSpeedAt,
  segmentsOf,
  selectLabels,
  shapeShownAt,
  starPositions,
  toVector,
} from './helpers';
import type { LabelPoint, Mark, PickResult, PlaceBuffers, PlaceShape, ProjectedPoint, Vec3 } from './types';

/** What the page asks of the 3D scene: every drawing decision is taken outside (see `helpers.ts`), this only owns
 * the three.js objects, the camera and the loop that draws them. */
export type GlobeScene = {
  setPlaces: (buffers: PlaceBuffers) => void;
  /** The names to write (one per place, in the places' order) and who to tell, whenever they change, which ones to
   * draw and where (empty when zoomed out): see `selectLabels`. */
  setLabels: (names: string[], listener: (labels: LabelPoint[]) => void) => void;
  setMarks: (selected: Mark, hovered: Mark) => void;
  /** What is under a pointer position (client pixels): the nearest place. */
  pick: (clientX: number, clientY: number) => PickResult;
  flyTo: (lon: number, lat: number) => void;
  resetView: () => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

type Drawn = LineSegments | Points;
type Slot = { object: Drawn | null };

const geometryOf = (positions: readonly number[], colors?: readonly number[]): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
};

/** The picture a round or star dot is cut from (drawn once, white: the vertices give the colour), or null for the
 * square, which needs none — and when there is no canvas to draw it on. */
const spriteOf = (shape: PlaceShape): CanvasTexture | null => {
  if (shape === 'square') return null;
  const picture = document.createElement('canvas');
  picture.width = SPRITE_SIZE;
  picture.height = SPRITE_SIZE;
  const context = picture.getContext('2d');
  if (context === null) return null;
  drawShape(context, shape, SPRITE_SIZE);
  return new CanvasTexture(picture);
};

/** Where the camera sits to look at (lon, lat) from `distance`. */
const cameraSpot = (lon: number, lat: number, distance: number): Vec3 => toVector(lon, lat, distance);

export const createGlobeScene = (canvas: HTMLCanvasElement): GlobeScene => {
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, CAMERA_NEAR, 400);
  camera.position.set(...cameraSpot(HOME_VIEW.lon, HOME_VIEW.lat, CAMERA_DISTANCE));

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050914);

  const controls = new OrbitControls(camera, canvas);
  // No inertia: the globe stops the moment the pointer does.
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.rotateSpeed = rotateSpeedAt(CAMERA_DISTANCE);

  // The sea, the land's own outline and the stars: the whole decor. No light (the sea is a flat colour) and nothing
  // else in the sky.
  const sea = new Mesh(new SphereGeometry(GLOBE_RADIUS, 96, 48), new MeshBasicMaterial({ color: SEA_COLOR }));
  const land = new LineSegments(
    geometryOf(segmentsOf(parseRings(GLOBE_LAND_PATH), LAND_ALTITUDE)),
    new LineBasicMaterial({ color: LAND_LINE_COLOR }),
  );
  const stars = new Points(
    geometryOf(starPositions(STAR_COUNT, STAR_RADIUS, STAR_SEED)),
    new PointsMaterial({ color: STAR_COLOR, size: STAR_SIZE, sizeAttenuation: false }),
  );
  scene.add(sea, land, stars);

  const places: Slot[] = PLACE_SHAPES.map(() => ({ object: null }));
  const sprites = new Map<PlaceShape, CanvasTexture | null>();
  const selectedLine: Slot = { object: null };
  const selectedPoint: Slot = { object: null };
  const hoveredLine: Slot = { object: null };
  const hoveredPoint: Slot = { object: null };
  let placePositions: number[] = [];
  let placeKinds: PlaceShape[] = [];
  let names: string[] = [];
  let labelListener: ((labels: LabelPoint[]) => void) | null = null;
  let labelSignature = '';
  let size = { width: 1, height: 1 };

  /** Puts `next` in the slot's place, handing what was there back to the graphics card. */
  const replace = (slot: Slot, next: Drawn | null) => {
    if (slot.object) {
      scene.remove(slot.object);
      slot.object.geometry.dispose();
      (slot.object.material as LineBasicMaterial | PointsMaterial).dispose();
    }
    slot.object = next;
    if (next) scene.add(next);
  };

  const setMark = (line: Slot, point: Slot, mark: Mark, color: number) => {
    replace(
      line,
      mark && mark.segments.length > 0
        ? new LineSegments(geometryOf(mark.segments), new LineBasicMaterial({ color }))
        : null,
    );
    replace(
      point,
      mark?.point
        ? new Points(
            geometryOf(mark.point),
            new PointsMaterial({ color, size: MARK_SIZE, sizeAttenuation: false }),
          )
        : null,
    );
  };

  let flight: { from: Vec3; to: Vec3; start: number | null } | null = null;
  const stepFlight = (time: number) => {
    if (flight === null) return;
    flight.start ??= time;
    const progress = Math.min(1, (time - flight.start) / FLY_MS);
    const eased = progress * progress * (3 - 2 * progress);
    const { from, to } = flight;
    const mixed: Vec3 = [
      from[0] + (to[0] - from[0]) * eased,
      from[1] + (to[1] - from[1]) * eased,
      from[2] + (to[2] - from[2]) * eased,
    ];
    // The straight line between the two spots dips through the globe: its length follows the distances instead.
    const distance = Math.hypot(...from) + (Math.hypot(...to) - Math.hypot(...from)) * eased;
    const scale = distance / Math.hypot(...mixed);
    camera.position.set(mixed[0] * scale, mixed[1] * scale, mixed[2] * scale);
    if (progress >= 1) flight = null;
  };

  const distanceOf = (): number => Math.hypot(camera.position.x, camera.position.y, camera.position.z);

  /** Level of detail: which shapes are drawn depends on how far the camera is (see CAPITALS_MAX_DISTANCE). */
  const applyDetail = () => {
    const distance = distanceOf();
    PLACE_SHAPES.forEach((shape, index) => {
      if (places[index].object) places[index].object!.visible = shapeShownAt(shape, distance);
    });
  };

  const signatureOf = (labels: LabelPoint[]): string =>
    labels.map((label) => `${label.index}:${Math.round(label.x)}:${Math.round(label.y)}`).join('|');

  const emitLabels = (labels: LabelPoint[]) => {
    const signature = signatureOf(labels);
    if (signature === labelSignature) return;
    labelSignature = signature;
    labelListener?.(labels);
  };

  let frame = 0;
  const loop = (time: number) => {
    frame = requestAnimationFrame(loop);
    stepFlight(time);
    controls.rotateSpeed = rotateSpeedAt(distanceOf());
    controls.update();
    applyDetail();
    renderer.render(scene, camera);
    if (labelListener) {
      const distance = distanceOf();
      emitLabels(
        labelsShownAt(distance)
          ? selectLabels(projectedPlaces(size.width, size.height), placeKinds, names, size.width, size.height, maxLabelsAt(distance))
          : [],
      );
    }
  };
  const positionOf = (): Vec3 => [camera.position.x, camera.position.y, camera.position.z];

  /** Flat `x, y, z` positions as points on the screen (px, in the canvas), each with whether it is in sight: on the
   * camera's side of its own horizon plane, and wanted by `wanted` (its index among the points). */
  const projectFlat = (
    flat: readonly number[],
    wanted: (index: number) => boolean,
    width: number,
    height: number,
  ): ProjectedPoint[] => {
    const eye = positionOf();
    const projected: ProjectedPoint[] = [];
    for (let index = 0; index < flat.length; index += 3) {
      const x = flat[index];
      const y = flat[index + 1];
      const z = flat[index + 2];
      const onScreen = new Vector3(x, y, z).project(camera);
      projected.push({
        x: ((onScreen.x + 1) / 2) * width,
        y: ((1 - onScreen.y) / 2) * height,
        visible: wanted(index / 3) && x * eye[0] + y * eye[1] + z * eye[2] > x * x + y * y + z * z,
      });
    }
    return projected;
  };

  const projectedPlaces = (width: number, height: number): ProjectedPoint[] => {
    const distance = distanceOf();
    return projectFlat(placePositions, (index) => shapeShownAt(placeKinds[index], distance), width, height);
  };

  frame = requestAnimationFrame(loop);

  return {
    setPlaces: ({ positions, kinds, shapes }) => {
      placePositions = positions;
      placeKinds = kinds;
      PLACE_SHAPES.forEach((shape, index) => {
        if (!sprites.has(shape)) sprites.set(shape, spriteOf(shape));
        const sprite = sprites.get(shape)!;
        replace(
          places[index],
          new Points(
            geometryOf(shapes[shape].positions, shapes[shape].colors),
            new PointsMaterial({
              size: PLACE_SIZES[shape],
              sizeAttenuation: false,
              vertexColors: true,
              ...(sprite ? { map: sprite, alphaTest: SPRITE_ALPHA_TEST, transparent: true } : {}),
            }),
          ),
        );
      });
      applyDetail();
    },
    setLabels: (next, listener) => {
      names = next;
      labelListener = listener;
      labelSignature = '';
    },
    setMarks: (selected, hovered) => {
      setMark(selectedLine, selectedPoint, selected, SELECTED_COLOR);
      setMark(hoveredLine, hoveredPoint, hovered, HOVER_COLOR);
    },
    pick: (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const place = nearestPoint(projectedPlaces(rect.width, rect.height), x, y, PICK_RADIUS_PX);
      return { place, x, y };
    },
    flyTo: (lon, lat) => {
      flight = { from: positionOf(), to: cameraSpot(lon, lat, FLY_DISTANCE), start: null };
    },
    resetView: () => {
      flight = { from: positionOf(), to: cameraSpot(HOME_VIEW.lon, HOME_VIEW.lat, CAMERA_DISTANCE), start: null };
    },
    resize: (width, height) => {
      size = { width, height };
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      controls.dispose();
      [...places, selectedLine, selectedPoint, hoveredLine, hoveredPoint].forEach((slot) => replace(slot, null));
      for (const part of [sea, land, stars]) {
        part.geometry.dispose();
        (part.material as MeshBasicMaterial).dispose();
      }
      sprites.forEach((sprite) => sprite?.dispose());
      renderer.dispose();
    },
  };
};
