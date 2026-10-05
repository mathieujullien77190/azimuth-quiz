import type { PlaceRow } from '../../api/places';
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from '../../constants';
import type { Category, Difficulty } from '@/types';

import {
  CAMERA_DISTANCE,
  CAPITALS_MAX_DISTANCE,
  LABEL_CHAR_PX,
  LABEL_GAP_PX,
  LABEL_HEIGHT_PX,
  LABEL_OFFSET_PX,
  LABELS_MAX_DISTANCE,
  MAX_LABELS,
  MAX_LABELS_CLOSE,
  MIN_DISTANCE,
  MIN_ROTATE_SPEED,
  NEUTRAL_PLACE_COLOR,
  PLACE_ALTITUDE,
  POINTS_MAX_DISTANCE,
  ROTATE_SPEED,
  SEARCH_RESULTS,
} from './constants';
import type {
  LonLat,
  LabelBox,
  LabelPoint,
  Mark,
  PlaceBuffers,
  PlaceShape,
  ProjectedPoint,
  SearchTarget,
  Selection,
  Vec3,
} from './types';

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Where a place is in the scene (unit sphere, same layout as the game's own 3D globe): the y axis is the poles,
 * longitude 0 faces +z. */
export const toVector = (lon: number, lat: number, altitude = 1): Vec3 => {
  const latitude = toRadians(lat);
  const longitude = toRadians(lon);
  return [
    altitude * Math.cos(latitude) * Math.sin(longitude),
    altitude * Math.sin(latitude),
    altitude * Math.cos(latitude) * Math.cos(longitude),
  ];
};

/** The rings of the world's land outline (`M lon lat L lon lat ... Z` per ring). */
export const parseRings = (path: string): LonLat[][] =>
  path
    .split('M')
    .filter((ring) => ring !== '')
    .map((ring) =>
      ring
        .replace('Z', '')
        .split('L')
        .map((pair) => {
          const [lon, lat] = pair.split(' ').map(Number);
          return [lon, lat] as const;
        }),
    );

/** The line segments (pairs of ends, as a flat list of coordinates) of closed rings, ready for a three.js buffer. */
export const segmentsOf = (rings: readonly (readonly LonLat[])[], altitude: number): number[] =>
  rings.flatMap((ring) =>
    ring.flatMap(([lon, lat], index) => {
      const [nextLon, nextLat] = ring[(index + 1) % ring.length];
      return [...toVector(lon, lat, altitude), ...toVector(nextLon, nextLat, altitude)];
    }),
  );

/** The index of the visible point nearest to (x, y) within `radius` pixels, or null. */
export const nearestPoint = (points: readonly ProjectedPoint[], x: number, y: number, radius: number): number | null => {
  let best: number | null = null;
  let bestDistance = radius;
  points.forEach((point, index) => {
    if (!point.visible) return;
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
};

/** `#rrggbb` as the number three.js takes. */
export const hexNumber = (css: string): number => parseInt(css.slice(1), 16);

/** `#rrggbb` as three 0-1 floats, for a colour buffer. */
export const hexFloats = (css: string): [number, number, number] => {
  const value = hexNumber(css);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

/** The colour of a place's dot: its Compass category's, grey for a place that is only in Clues. */
export const placeColor = (category: Category | null): string =>
  category === null ? NEUTRAL_PLACE_COLOR : CATEGORY_COLORS[category];

export const categoryOf = (row: PlaceRow): Category | null => row.compass?.category ?? null;
export const difficultyOf = (row: PlaceRow): Difficulty => (row.compass ?? row.clues)!.difficulty;

/** The places that pass the category and difficulty filters (a place only in Clues has no category: the category
 * chips do not apply to it). */
export const visiblePlaces = (
  rows: readonly PlaceRow[],
  categories: ReadonlySet<Category>,
  difficulties: ReadonlySet<Difficulty>,
): PlaceRow[] =>
  rows.filter((row) => {
    const category = categoryOf(row);
    return (category === null || categories.has(category)) && difficulties.has(difficultyOf(row));
  });

export const PLACE_SHAPES: readonly PlaceShape[] = ['round', 'star', 'square'];

/** The shape of a place's dot: round for the cities (also the French ones), a star for the capitals, a square for
 * everything else (mountains, landmarks, nature, kids, and a place that is only in Clues). */
export const placeShape = (category: Category | null): PlaceShape => {
  if (category === 'cities' || category === 'citiesFr') return 'round';
  return category === 'capital' ? 'star' : 'square';
};

/** The dots of the places for the scene: every position in order (for picking), and the dots split by shape. */
export const placeBuffers = (rows: readonly PlaceRow[], altitude: number): PlaceBuffers => {
  const shapes: PlaceBuffers['shapes'] = {
    round: { positions: [], colors: [] },
    star: { positions: [], colors: [] },
    square: { positions: [], colors: [] },
  };
  const positions: number[] = [];
  const kinds: PlaceShape[] = [];
  for (const row of rows) {
    const category = categoryOf(row);
    const position = toVector(row.coordinates.longitude, row.coordinates.latitude, altitude);
    positions.push(...position);
    const shape = placeShape(category);
    kinds.push(shape);
    const group = shapes[shape];
    group.positions.push(...position);
    group.colors.push(...hexFloats(placeColor(category)));
  }
  return { positions, kinds, shapes };
};

/** What `drawShape` needs of a canvas context (so that it can be tested without a canvas). */
export type ShapeContext = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  beginPath: () => void;
  arc: (x: number, y: number, radius: number, from: number, to: number) => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  closePath: () => void;
  fill: () => void;
};

/** Paints a white round dot or 5-branch star filling a `size` x `size` picture (the dot's colour comes from the
 * vertices, the picture only cuts the shape out). */
export const drawShape = (context: ShapeContext, shape: 'round' | 'star', size: number): void => {
  const middle = size / 2;
  context.fillStyle = '#ffffff';
  context.beginPath();
  if (shape === 'round') {
    context.arc(middle, middle, middle * 0.9, 0, Math.PI * 2);
  } else {
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? middle * 0.98 : middle * 0.42;
      const angle = -Math.PI / 2 + (point * Math.PI) / 5;
      const x = middle + radius * Math.cos(angle);
      const y = middle + radius * Math.sin(angle);
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
  }
  context.closePath();
  context.fill();
};

/** What the search box finds: the places whose name or country matches, the first ones. */
export const searchTargets = (query: string, rows: readonly PlaceRow[]): SearchTarget[] => {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  return rows
    .filter((row) => row.name.toLowerCase().includes(q) || row.country.toLowerCase().includes(q))
    .map(
      (row): SearchTarget => ({
        kind: 'place',
        id: row.key,
        label: `📍 ${row.name}`,
        lon: row.coordinates.longitude,
        lat: row.coordinates.latitude,
      }),
    )
    .slice(0, SEARCH_RESULTS);
};

/** `count` points scattered over a sphere of `radius` (a small seeded generator: the same sky every time). */
export const starPositions = (count: number, radius: number, seed: number): number[] => {
  let state = seed >>> 0;
  const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const lon = random() * 360 - 180;
    const lat = toDegrees(Math.asin(random() * 2 - 1));
    return toVector(lon, lat, radius);
  }).flat();
};

/** What is drawn brighter for a selected / hovered place: its dot. */
export const markFor = (target: Selection | null, rows: readonly PlaceRow[]): Mark => {
  if (target === null) return null;
  const row = rows.find((entry) => entry.key === target.id);
  return row
    ? { segments: [], point: toVector(row.coordinates.longitude, row.coordinates.latitude, PLACE_ALTITUDE + 0.002) }
    : null;
};

/** Whether the dots of this shape are drawn (and pickable) with the camera `distance` from the middle: the capitals
 * from further away than the others (see CAPITALS_MAX_DISTANCE). */
export const shapeShownAt = (shape: PlaceShape, distance: number): boolean =>
  distance <= (shape === 'star' ? CAPITALS_MAX_DISTANCE : POINTS_MAX_DISTANCE);

/** Whether the permanent names are drawn with the camera `distance` from the middle. */
export const labelsShownAt = (distance: number): boolean => distance <= LABELS_MAX_DISTANCE;

/** The room a name takes written to the right of its dot at (x, y). */
export const labelBox = (point: { x: number; y: number }, name: string): LabelBox => ({
  left: point.x,
  right: point.x + LABEL_OFFSET_PX + name.length * LABEL_CHAR_PX,
  top: point.y - LABEL_HEIGHT_PX / 2,
  bottom: point.y + LABEL_HEIGHT_PX / 2,
});

const touches = (a: LabelBox, b: LabelBox): boolean =>
  a.left < b.right + LABEL_GAP_PX &&
  a.right + LABEL_GAP_PX > b.left &&
  a.top < b.bottom + LABEL_GAP_PX &&
  a.bottom + LABEL_GAP_PX > b.top;

/**
 * Which names to write, and where: among the places in sight (on the near side of the globe, inside the canvas), the
 * capitals first then the ones closest to the middle of the canvas, as many as fit — each name takes a box to the
 * right of its dot (see `labelBox`), and a name whose box would touch one already kept is dropped — up to `max`.
 */
export const selectLabels = (
  points: readonly ProjectedPoint[],
  kinds: readonly PlaceShape[],
  names: readonly string[],
  width: number,
  height: number,
  max: number = MAX_LABELS,
): LabelPoint[] => {
  const middleX = width / 2;
  const middleY = height / 2;
  const candidates = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.visible && point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height)
    .sort(
      (a, b) =>
        Number(kinds[b.index] === 'star') - Number(kinds[a.index] === 'star') ||
        Math.hypot(a.point.x - middleX, a.point.y - middleY) - Math.hypot(b.point.x - middleX, b.point.y - middleY),
    );
  const taken: LabelBox[] = [];
  const kept: LabelPoint[] = [];
  for (const { point, index } of candidates) {
    if (kept.length >= max) break;
    const box = labelBox(point, names[index]);
    if (taken.some((other) => touches(box, other))) continue;
    taken.push(box);
    kept.push({ index, x: point.x, y: point.y });
  }
  return kept;
};

/** How many names may be written with the camera `distance` from the middle: MAX_LABELS where they begin to show,
 * more and more the closer one gets, up to MAX_LABELS_CLOSE at the closest. */
export const maxLabelsAt = (distance: number): number => {
  const closeness = (LABELS_MAX_DISTANCE - distance) / (LABELS_MAX_DISTANCE - MIN_DISTANCE);
  return Math.round(MAX_LABELS + Math.max(0, Math.min(1, closeness)) * (MAX_LABELS_CLOSE - MAX_LABELS));
};

/** How fast a drag turns the globe at this camera `distance`: in proportion to how far the camera is above the ground
 * (the same drag covers less ground the closer one is), within ROTATE_SPEED and MIN_ROTATE_SPEED. */
export const rotateSpeedAt = (distance: number): number =>
  Math.max(MIN_ROTATE_SPEED, Math.min(ROTATE_SPEED, (ROTATE_SPEED * (distance - 1)) / (CAMERA_DISTANCE - 1)));
