type LonLat = readonly [number, number];

export type ContourHoleSplit = {
  /** `holeCount` hidden gaps (one per player), each including its two shared anchor points. */
  holes: LonLat[][];
  /** `holeCount` visible arcs between consecutive holes, each including its two shared anchor
   * points — together with `holes`, retraces the whole ring exactly once. `visibleSegments[i]`
   * runs from `holes[i]`'s end to `holes[i + 1]`'s start (wrapping after the last). */
  visibleSegments: LonLat[][];
};

/**
 * Splits a closed ring (first point === last, as stored in CONTOURS) into `holeCount` evenly
 * spaced hidden gaps and the visible arcs between them. Each hole is sized to `holeRatio` of the
 * ring's points (rounded, floored at 3): pass a small ratio (~8%) for several players sharing the
 * same contour with one gap each, or a single large one (~40%, with `holeCount` 1) to reproduce
 * the original solo difficulty — same function either way, just different parameters. The split
 * point (so which physical gap ends up "hole 0") is random each call.
 */
export const splitContourHoles = (ring: readonly LonLat[], holeCount: number, holeRatio: number): ContourHoleSplit => {
  const points = ring.slice(0, -1);
  const count = points.length;
  const segmentSpacing = Math.floor(count / holeCount);
  const holeSize = Math.max(3, Math.min(segmentSpacing - 3, Math.round(count * holeRatio)));
  const start = Math.floor(Math.random() * count);

  const holes: LonLat[][] = [];
  const visibleSegments: LonLat[][] = [];

  for (let i = 0; i < holeCount; i += 1) {
    const holeStart = start + i * segmentSpacing;
    const holeEnd = holeStart + holeSize;
    const hole: LonLat[] = [];
    for (let j = holeStart; j <= holeEnd; j += 1) hole.push(points[j % count]);
    holes.push(hole);

    // The last segment closes the loop back to hole 0's own start (start + count) rather than
    // the regular (start + (i+1)*segmentSpacing): `count` isn't always an exact multiple of
    // `holeCount`, so this absorbs the remainder instead of leaving a few points uncovered.
    const nextHoleStart = i === holeCount - 1 ? start + count : start + (i + 1) * segmentSpacing;
    const visible: LonLat[] = [];
    for (let j = holeEnd; j <= nextHoleStart; j += 1) visible.push(points[j % count]);
    visibleSegments.push(visible);
  }

  return { holes, visibleSegments };
};
