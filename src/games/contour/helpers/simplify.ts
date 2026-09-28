type LonLat = readonly [number, number];

/** Number of precision levels a silhouette goes through (0 = coarsest ... 3 = the full ring). */
export const PRECISION_LEVELS = 4;
/** Index of the last level: the full, unsimplified ring. */
export const FULL_PRECISION = PRECISION_LEVELS - 1;

/** Vertex count of the coarsest level (or the whole ring when it has fewer vertices). */
const COARSE_VERTICES = 10;
/** Share of the ring's vertices kept at levels 1 and 2. */
const LEVEL_SHARES = [0.25, 0.55] as const;
/** Each level adds at least this many vertices to the previous one (while the ring has any left),
 * so that a small country still gets a visibly more precise outline at every hint. */
const MIN_STEP = 3;
/** A ring never gets below a triangle. */
const MIN_VERTICES = 3;
/** Each vertex's area is multiplied by a random factor in [1 - JITTER, 1 + JITTER]: that is what
 * makes the coarse versions differ a little from one seed to the next, without ever becoming a
 * different shape (the factor only reorders vertices whose areas are already close). */
const JITTER = 0.4;

/** Small, fast, well-distributed 32-bit PRNG: same seed, same sequence, on every device. */
export const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** A fresh room-wide seed, drawn by the host when the game starts (32-bit, so it is a plain number
 * in Firestore). */
export const newSimplifySeed = (): number => Math.floor(Math.random() * 4294967296);

/**
 * Seed of one round's simplification, from the room's seed, the round and the country: the same
 * three values give the same 32-bit seed on every device (FNV-1a over their text), and each round
 * of a game gets its own variation.
 */
export const roundSimplifySeed = (roomSeed: number, roundIndex: number, countryCode: string): number => {
  let hash = 0x811c9dc5;
  for (const char of `${roomSeed}:${roundIndex}:${countryCode}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
  }
  return hash;
};

/** Vertex counts (closed-ring duplicate excluded) of levels 0 to 3 for a ring of `n` vertices: about
 * 10, 25 % and 55 % of them, then all (at least `MIN_STEP` more at each level while there are any
 * left); never decreasing, never above `n`, all equal to `n` for a ring too small to be simplified. */
export const levelVertexCounts = (n: number): number[] => {
  if (n <= MIN_VERTICES) return Array<number>(PRECISION_LEVELS).fill(n);
  const coarse = Math.min(n, Math.max(MIN_VERTICES, COARSE_VERTICES));
  const level1 = Math.min(n, Math.max(coarse + MIN_STEP, Math.round(n * LEVEL_SHARES[0])));
  const level2 = Math.min(n, Math.max(level1 + MIN_STEP, Math.round(n * LEVEL_SHARES[1])));
  return [coarse, level1, level2, n];
};

/**
 * Nested versions of a closed ring, from a very coarse one to the ring itself (`levels[3]` is
 * `points` itself, untouched, so shared borders stay exactly equal to the neighbors' edges).
 *
 * Visvalingam-Whyatt: repeatedly drops the vertex whose triangle with its two neighbors is the
 * smallest, its area multiplied by a per-vertex random factor drawn from `seed` — so the coarse
 * levels vary a little with the seed while staying faithful to the shape. The removal order makes
 * the levels nested (level k+1 contains every vertex of level k: the outline only ever gains
 * detail, it never jumps). The first vertex is never removed, and the vertices keep their order,
 * so the start point and the winding are the ring's own.
 *
 * Cost: O(n * (n - coarse)) on the ring's n vertices (a few hundred at most, so at worst a few
 * hundred thousand operations) — cheap enough to run on the fly, once per (country, seed).
 */
export const simplificationLevels = (points: readonly LonLat[], seed: number): (readonly LonLat[])[] => {
  const last = points[points.length - 1];
  const closed = points[0][0] === last[0] && points[0][1] === last[1];
  const n = closed ? points.length - 1 : points.length;
  const counts = levelVertexCounts(n);
  if (counts[0] === n) return counts.map(() => points);

  // Longitude degrees shrink with latitude: same correction as the board's own projector.
  const meanLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const lonScale = Math.cos((meanLat * Math.PI) / 180);
  const random = mulberry32(seed);
  const factor = Array.from({ length: n }, () => 1 - JITTER + 2 * JITTER * random());

  const previous = Array.from({ length: n }, (_, i) => (i + n - 1) % n);
  const next = Array.from({ length: n }, (_, i) => (i + 1) % n);
  const alive = Array<boolean>(n).fill(true);
  const weight = (i: number): number => {
    const a = points[previous[i]];
    const b = points[i];
    const c = points[next[i]];
    const cross = (b[0] - a[0]) * lonScale * (c[1] - a[1]) - (c[0] - a[0]) * lonScale * (b[1] - a[1]);
    return Math.abs(cross) * factor[i];
  };
  const weights = Array.from({ length: n }, (_, i) => weight(i));

  // Removal order down to the coarsest level; vertex 0 is the anchor and is never a candidate.
  const removed: number[] = [];
  for (let remaining = n; remaining > counts[0]; remaining -= 1) {
    let best = -1;
    for (let i = 1; i < n; i += 1) {
      if (alive[i] && (best === -1 || weights[i] < weights[best])) best = i;
    }
    alive[best] = false;
    removed.push(best);
    next[previous[best]] = next[best];
    previous[next[best]] = previous[best];
    // Vertex 0's weight is refreshed too but never read: the search above starts at 1.
    weights[previous[best]] = weight(previous[best]);
    weights[next[best]] = weight(next[best]);
  }

  return counts.map((count) => {
    if (count === n) return points;
    const dropped = new Set(removed.slice(0, n - count));
    const ring = points.slice(0, n).filter((_, i) => !dropped.has(i));
    return [...ring, points[0]];
  });
};
