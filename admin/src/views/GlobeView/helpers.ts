import type { CountryRecord } from '../../api/countries';
import type { PlaceRow } from '../../api/places';
import { CATEGORY_COLORS, DIFFICULTY_COLORS } from '../../constants';
import type { Category, Difficulty } from '@/types';

import {
  CAMERA_DISTANCE,
  CAPITALS_MAX_DISTANCE,
  COUNTRY_LABELS_MAX_DISTANCE,
  COUNTRY_LABELS_MIN_DISTANCE,
  HIGHLIGHT_ALTITUDE,
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
  CountryShape,
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

/** A longitude brought back into [-180, 180[. */
export const wrapLongitude = (longitude: number): number => ((((longitude + 180) % 360) + 360) % 360) - 180;

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

/** The other way round: the longitude and latitude (degrees) of the point of the globe in that direction. */
export const fromVector = ([x, y, z]: Vec3): { lon: number; lat: number } => {
  const length = Math.hypot(x, y, z);
  return { lat: toDegrees(Math.asin(y / length)), lon: toDegrees(Math.atan2(x, z)) };
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

/** The ring with its longitudes made continuous: a country crossing the date line (Russia, Fiji...) jumps from +180
 * to -180, which would cut it in two — followed the short way, the longitude simply goes on past 180. */
export const unwrapRing = (ring: readonly LonLat[]): LonLat[] => {
  const unwrapped: LonLat[] = [];
  let previous = ring[0][0];
  for (const [lon, lat] of ring) {
    const shifted = lon + Math.round((previous - lon) / 360) * 360;
    unwrapped.push([shifted, lat]);
    previous = shifted;
  }
  return unwrapped;
};

export const shapeOf = (code: string, ring: readonly LonLat[], difficulty: Difficulty): CountryShape => {
  const continuous = unwrapRing(ring);
  const longitudes = continuous.map(([lon]) => lon);
  const latitudes = continuous.map(([, lat]) => lat);
  return {
    code,
    ring: continuous,
    difficulty,
    minLon: Math.min(...longitudes),
    maxLon: Math.max(...longitudes),
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
  };
};

/** Ray casting: whether the point is inside the ring (as it is, longitudes already continuous). */
const insideRing = (lon: number, lat: number, ring: readonly LonLat[]): boolean => {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [lonA, latA] = ring[index];
    const [lonB, latB] = ring[previous];
    if (latA > lat !== latB > lat && lon < ((lonB - lonA) * (lat - latA)) / (latB - latA) + lonA) inside = !inside;
  }
  return inside;
};

/** Whether the point is inside the country, wherever the date line falls: the point is tried one turn of the world
 * either way too, since the country's longitudes may run past 180. */
export const insideShape = (lon: number, lat: number, shape: CountryShape): boolean => {
  if (lat < shape.minLat || lat > shape.maxLat) return false;
  return [lon, lon + 360, lon - 360].some(
    (candidate) => candidate >= shape.minLon && candidate <= shape.maxLon && insideRing(candidate, lat, shape.ring),
  );
};

const areaOf = (shape: CountryShape): number => (shape.maxLon - shape.minLon) * (shape.maxLat - shape.minLat);

/** The code of the country around a point of the globe (the smallest box wins when outlines overlap), or null. */
export const countryAt = (lon: number, lat: number, shapes: readonly CountryShape[]): string | null => {
  let found: CountryShape | null = null;
  for (const shape of shapes) {
    if (insideShape(lon, lat, shape) && (found === null || areaOf(shape) < areaOf(found))) found = shape;
  }
  return found?.code ?? null;
};

/** The middle of a country's box, as a longitude and latitude. */
export const centerOf = (shape: CountryShape): { lon: number; lat: number } => ({
  lon: wrapLongitude((shape.minLon + shape.maxLon) / 2),
  lat: (shape.minLat + shape.maxLat) / 2,
});

/** Where a ray from `origin` along `direction` first meets the sphere of `radius` around the middle, or null. */
export const raySphereHit = (origin: Vec3, direction: Vec3, radius = 1): Vec3 | null => {
  const length = Math.hypot(...direction);
  const d: Vec3 = [direction[0] / length, direction[1] / length, direction[2] / length];
  const b = origin[0] * d[0] + origin[1] * d[1] + origin[2] * d[2];
  const c = origin[0] ** 2 + origin[1] ** 2 + origin[2] ** 2 - radius ** 2;
  const discriminant = b * b - c;
  if (discriminant < 0) return null;
  const distance = -b - Math.sqrt(discriminant);
  if (distance < 0) return null;
  return [origin[0] + d[0] * distance, origin[1] + d[1] * distance, origin[2] + d[2] * distance];
};

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

export const difficultyColor = (difficulty: Difficulty): number => hexNumber(DIFFICULTY_COLORS[difficulty]);

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

/** Every country outline, grouped by silhouette difficulty, as line segments for the scene. */
export const countryGroups = (
  shapes: readonly CountryShape[],
  difficulties: ReadonlySet<Difficulty>,
  altitude: number,
): { difficulty: Difficulty; positions: number[] }[] =>
  (['easy', 'intermediate', 'hard'] as const)
    .filter((difficulty) => difficulties.has(difficulty))
    .map((difficulty) => ({
      difficulty,
      positions: segmentsOf(
        shapes.filter((shape) => shape.difficulty === difficulty).map((shape) => shape.ring),
        altitude,
      ),
    }));

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

/** The middle of a country's own places (for a country without an outline), or null when it has none. */
const placesCenter = (rows: readonly PlaceRow[]): { lon: number; lat: number } | null =>
  rows.length === 0
    ? null
    : {
        lon: rows.reduce((sum, row) => sum + row.coordinates.longitude, 0) / rows.length,
        lat: rows.reduce((sum, row) => sum + row.coordinates.latitude, 0) / rows.length,
      };

/** What the search box finds: countries (by name or code, placed at the middle of their outline — or of their
 * places when they have none) and places (by name), the first ones matching. */
export const searchTargets = (
  query: string,
  countries: readonly CountryRecord[],
  shapes: readonly CountryShape[],
  rows: readonly PlaceRow[],
): SearchTarget[] => {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  const found: SearchTarget[] = [];
  for (const country of countries) {
    const matches = country.fr.toLowerCase().includes(q) || country.en.toLowerCase().includes(q) || country.code.toLowerCase() === q;
    if (!matches) continue;
    const shape = shapes.find((entry) => entry.code === country.code);
    const spot = shape ? centerOf(shape) : placesCenter(rows.filter((row) => row.code === country.code));
    if (spot !== null) found.push({ kind: 'country', id: country.code, label: `🌍 ${country.fr}`, ...spot });
  }
  for (const row of rows) {
    if (!row.name.toLowerCase().includes(q)) continue;
    found.push({
      kind: 'place',
      id: row.key,
      label: `📍 ${row.name}`,
      lon: row.coordinates.longitude,
      lat: row.coordinates.latitude,
    });
  }
  return found.slice(0, SEARCH_RESULTS);
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

/** What is drawn brighter for a selected / hovered thing: a country's outline, or a place's dot. */
export const markFor = (
  target: Selection | null,
  shapes: readonly CountryShape[],
  rows: readonly PlaceRow[],
): Mark => {
  if (target === null) return null;
  if (target.kind === 'country') {
    const shape = shapes.find((entry) => entry.code === target.id);
    return shape ? { segments: segmentsOf([shape.ring], HIGHLIGHT_ALTITUDE), point: null } : null;
  }
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

/** Whether the country names are drawn with the camera `distance` from the middle: from far away, until the cities
 * take over. */
export const countryLabelsShownAt = (distance: number): boolean =>
  distance <= COUNTRY_LABELS_MAX_DISTANCE && distance >= COUNTRY_LABELS_MIN_DISTANCE;

/** The room a name takes written to the right of its dot at (x, y): `charPx` per letter, `height` tall. */
export const labelBox = (
  point: { x: number; y: number },
  name: string,
  charPx: number = LABEL_CHAR_PX,
  height: number = LABEL_HEIGHT_PX,
): LabelBox => ({
  left: point.x,
  right: point.x + LABEL_OFFSET_PX + name.length * charPx,
  top: point.y - height / 2,
  bottom: point.y + height / 2,
});

const touches = (a: LabelBox, b: LabelBox): boolean =>
  a.left < b.right + LABEL_GAP_PX &&
  a.right + LABEL_GAP_PX > b.left &&
  a.top < b.bottom + LABEL_GAP_PX &&
  a.bottom + LABEL_GAP_PX > b.top;

/**
 * Which names to write, and where: among the places in sight (on the near side of the globe, inside the canvas), the
 * capitals first then the ones closest to the middle of the canvas, as many as fit — each name takes a box to the
 * right of its dot (see `labelBox`), and a name whose box would touch one already kept, or one of the `blocked`
 * boxes (the country names, which win), is dropped — up to `max`.
 */
export const selectLabels = (
  points: readonly ProjectedPoint[],
  kinds: readonly PlaceShape[],
  names: readonly string[],
  width: number,
  height: number,
  max: number = MAX_LABELS,
  options: { charPx?: number; lineHeight?: number; blocked?: readonly LabelBox[] } = {},
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
  const taken: LabelBox[] = [...(options.blocked ?? [])];
  const kept: LabelPoint[] = [];
  for (const { point, index } of candidates) {
    if (kept.length >= max) break;
    const box = labelBox(point, names[index], options.charPx, options.lineHeight);
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
