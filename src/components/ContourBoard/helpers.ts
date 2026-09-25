import type { Point2D } from '@/types';

type LonLat = readonly [number, number];

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

type RingBounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
  /** cos(mid-latitude): longitude degrees shrink with latitude, this keeps shapes near the poles
   * from stretching sideways. */
  lonScale: number;
};

const ringBounds = (ring: readonly LonLat[]): RingBounds => {
  const lons = ring.map((point) => point[0]);
  const lats = ring.map((point) => point[1]);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  return { minLon, maxLon, minLat, maxLat, lonScale: Math.cos(toRadians((minLat + maxLat) / 2)) };
};

const contentSize = (bounds: RingBounds): { width: number; height: number } => ({
  width: Math.max(1e-6, (bounds.maxLon - bounds.minLon) * bounds.lonScale),
  height: Math.max(1e-6, bounds.maxLat - bounds.minLat),
});

/**
 * Canvas size that fits `ring`'s own aspect ratio within `maxWidth` x `maxHeight` ("contain" fit:
 * shrinks whichever dimension needs it to respect both caps, keeping the ratio) — the board is a
 * rectangle shaped like the country instead of a square with letterboxing on the narrower axis.
 */
export const boardDimensionsFor = (ring: readonly LonLat[], maxWidth: number, maxHeight: number): { width: number; height: number } => {
  const { width: contentWidth, height: contentHeight } = contentSize(ringBounds(ring));
  const aspectRatio = contentHeight / contentWidth;

  let width = maxWidth;
  let height = width * aspectRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height / aspectRatio;
  }
  return { width, height };
};

/**
 * Builds a lon/lat -> screen-space projector fit to `size` (a `{width, height}` rectangle,
 * typically from `boardDimensionsFor`), based on `ring`'s own bounding box — the same projector
 * must be reused for every arc/trace of a round (visible, holes, every player's trace) so they
 * all land in the same frame.
 */
export const createProjector = (
  ring: readonly LonLat[],
  size: { width: number; height: number },
  padding: number,
): ((point: LonLat) => Point2D) => {
  const bounds = ringBounds(ring);
  const { width: contentWidth, height: contentHeight } = contentSize(bounds);
  const availableWidth = Math.max(1e-6, size.width - padding * 2);
  const availableHeight = Math.max(1e-6, size.height - padding * 2);
  const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);

  const offsetX = padding + (availableWidth - contentWidth * scale) / 2;
  const offsetY = padding + (availableHeight - contentHeight * scale) / 2;

  return ([lon, lat]) => ({
    x: offsetX + (lon - bounds.minLon) * bounds.lonScale * scale,
    y: offsetY + (bounds.maxLat - lat) * scale,
  });
};

export const projectPoints = (points: readonly LonLat[], project: (point: LonLat) => Point2D): Point2D[] => points.map(project);

/** `d` attribute for an open polyline through `points` ("M x,y L x,y ..."). */
export const polylinePath = (points: readonly Point2D[]): string =>
  points.length === 0 ? '' : `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((point) => `L ${point.x} ${point.y}`).join(' ');

/** Total length of the straight segments through `points` (exactly matches `polylinePath`'s own
 * "L" segments, since it never curves): used to size the "drawn by a pen" reveal animation's
 * `strokeDasharray`/`strokeDashoffset` on the true contour trace. */
export const polylineLength = (points: readonly Point2D[]): number =>
  points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
