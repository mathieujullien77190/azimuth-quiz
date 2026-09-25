import { splitContourHoles } from './contourGeometry';

// 65 points: matches France, the smallest of the 8 Contour countries' simplified outlines — not
// evenly divisible by every holeCount below, on purpose (real data never is either).
const RING_POINTS: [number, number][] = Array.from({ length: 65 }, (_, i) => [i, i * 2]);
const CLOSED_RING: [number, number][] = [...RING_POINTS, RING_POINTS[0]];

describe('splitContourHoles', () => {
  it('produces exactly holeCount holes and holeCount visible segments', () => {
    const { holes, visibleSegments } = splitContourHoles(CLOSED_RING, 4, 0.08);
    expect(holes).toHaveLength(4);
    expect(visibleSegments).toHaveLength(4);
  });

  it('shares each hole\'s two anchors with its flanking visible segments', () => {
    const holeCount = 3;
    const { holes, visibleSegments } = splitContourHoles(CLOSED_RING, holeCount, 0.08);
    for (let i = 0; i < holeCount; i += 1) {
      const hole = holes[i];
      const previousVisible = visibleSegments[(i - 1 + holeCount) % holeCount];
      const nextVisible = visibleSegments[i];
      expect(hole[0]).toEqual(previousVisible[previousVisible.length - 1]);
      expect(hole[hole.length - 1]).toEqual(nextVisible[0]);
    }
  });

  it('covers every point of the ring exactly once, shared anchors aside', () => {
    const holeCount = 5;
    const { holes, visibleSegments } = splitContourHoles(CLOSED_RING, holeCount, 0.08);
    const totalPoints = [...holes, ...visibleSegments].reduce((sum, segment) => sum + segment.length, 0);
    // 2 * holeCount segments around a closed loop share exactly 2 * holeCount anchor points
    // (each counted twice, once per adjacent segment).
    expect(totalPoints - 2 * holeCount).toBe(RING_POINTS.length);
  });

  it('keeps each hole a small minority of the ring at a typical multiplayer ratio', () => {
    const { holes } = splitContourHoles(CLOSED_RING, 6, 0.08);
    holes.forEach((hole) => {
      const ratio = (hole.length - 1) / RING_POINTS.length;
      expect(ratio).toBeLessThan(0.15);
    });
  });

  it('leaves a majority of the ring visible even at 6 holes (max players)', () => {
    const { holes } = splitContourHoles(CLOSED_RING, 6, 0.08);
    const hiddenPoints = holes.reduce((sum, hole) => sum + (hole.length - 1), 0);
    expect(hiddenPoints / RING_POINTS.length).toBeLessThan(0.5);
  });

  it('reproduces the original single ~40% hidden arc for holeCount 1 (solo)', () => {
    const { holes, visibleSegments } = splitContourHoles(CLOSED_RING, 1, 0.4);
    expect(holes).toHaveLength(1);
    expect(visibleSegments).toHaveLength(1);
    const ratio = (holes[0].length - 1) / RING_POINTS.length;
    expect(ratio).toBeCloseTo(0.4, 1);
  });

  it('varies the split across repeated calls (random start)', () => {
    const starts = new Set(Array.from({ length: 20 }, () => splitContourHoles(CLOSED_RING, 3, 0.08).holes[0][0].join(',')));
    expect(starts.size).toBeGreaterThan(1);
  });
});
