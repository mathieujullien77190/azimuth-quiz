import type { ContourCountry } from '@/types';

type LonLat = readonly [number, number];

/** A connected stretch of a country's outline, all coast or all shared border. */
export type OutlineRun = { shared: boolean; points: LonLat[] };

/** What surrounds a country on the board, still in lon/lat (projected later, by `projectRound`). */
export type CountryBorders = {
  /** Rings of the countries that share at least one border edge with the target: drawn as a plain
   * background fill, never stroked (their own coast is not the target's business). */
  neighborRings: (readonly LonLat[])[];
  /** Stretches of the target's outline that touch no neighbor: the coast, stroked as before. */
  coastRuns: LonLat[][];
  /** Stretches of the target's outline shared with a neighbor: stroked ONCE, at the target's side. */
  borderRuns: LonLat[][];
};

const pointKey = (point: LonLat): string => `${point[0]},${point[1]}`;

/** Order-independent key of the edge `a`-`b`: the same segment walked in the other direction (a
 * border is traversed backwards by the neighbor's ring) gives the same key. */
const edgeKey = (a: LonLat, b: LonLat): string => {
  const keyA = pointKey(a);
  const keyB = pointKey(b);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
};

const ringEdgeKeys = (ring: readonly LonLat[]): string[] => {
  const keys: string[] = [];
  for (let index = 0; index < ring.length - 1; index += 1) keys.push(edgeKey(ring[index], ring[index + 1]));
  return keys;
};

const ringBox = (ring: readonly LonLat[]) => {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, maxLon, minLat, maxLat };
};

/**
 * Splits a closed ring into runs of consecutive edges that are all in `sharedEdges` or all out of
 * it. Consecutive runs share their junction point, so drawing them one after the other leaves no
 * gap; the last run is glued to the first when they have the same nature (the ring's starting
 * point is arbitrary, it must not cut a coast or a border in two).
 */
export const splitRing = (ring: readonly LonLat[], sharedEdges: ReadonlySet<string>): OutlineRun[] => {
  const runs: OutlineRun[] = [];
  for (let index = 0; index < ring.length - 1; index += 1) {
    const shared = sharedEdges.has(edgeKey(ring[index], ring[index + 1]));
    const current = runs[runs.length - 1];
    if (current && current.shared === shared) current.points.push(ring[index + 1]);
    else runs.push({ shared, points: [ring[index], ring[index + 1]] });
  }
  const first = runs[0];
  const last = runs[runs.length - 1];
  if (runs.length > 1 && first.shared === last.shared) {
    last.points.push(...first.points.slice(1));
    runs.shift();
  }
  return runs;
};

/**
 * Finds the countries that touch `country` and splits its outline into coast and shared borders.
 *
 * "Touch" means sharing at least one identical edge (same two vertices): the whole world comes
 * from a single simplified topology, so a border common to two
 * countries is made of the very same points in both rings — no geometry to intersect, an exact
 * lookup is enough. Countries whose bounding box cannot meet the target's are skipped upfront.
 */
export const computeBorders = (country: ContourCountry, countries: readonly ContourCountry[]): CountryBorders => {
  const ownEdges = new Set(ringEdgeKeys(country.points));
  const box = ringBox(country.points);
  const sharedEdges = new Set<string>();
  const neighborRings: (readonly LonLat[])[] = [];

  for (const other of countries) {
    if (other.code === country.code) continue;
    const otherBox = ringBox(other.points);
    if (
      otherBox.maxLon < box.minLon ||
      otherBox.minLon > box.maxLon ||
      otherBox.maxLat < box.minLat ||
      otherBox.minLat > box.maxLat
    ) {
      continue;
    }
    const common = ringEdgeKeys(other.points).filter((key) => ownEdges.has(key));
    if (common.length === 0) continue;
    common.forEach((key) => sharedEdges.add(key));
    neighborRings.push(other.points);
  }

  const runs = splitRing(country.points, sharedEdges);
  return {
    neighborRings,
    coastRuns: runs.filter((run) => !run.shared).map((run) => run.points),
    borderRuns: runs.filter((run) => run.shared).map((run) => run.points),
  };
};
