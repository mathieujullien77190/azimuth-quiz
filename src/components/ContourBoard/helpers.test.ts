import { boardDimensionsFor, createProjector, createUnprojector, polylinePath, projectPoints } from './helpers';

describe('createProjector', () => {
  it('centers a square ring within the available square, padding respected', () => {
    // Straddles the equator (mid-latitude 0): cos(0) = 1 exactly, so a square ring stays square.
    const ring: [number, number][] = [
      [0, -5],
      [10, -5],
      [10, 5],
      [0, 5],
    ];
    const project = createProjector(ring, { width: 100, height: 100 }, 10);
    const topLeft = project([0, 5]);
    const bottomRight = project([10, -5]);
    expect(topLeft.x).toBeCloseTo(10);
    expect(topLeft.y).toBeCloseTo(10);
    expect(bottomRight.x).toBeCloseTo(90);
    expect(bottomRight.y).toBeCloseTo(90);
  });

  it('places north above south (smaller y for higher latitude)', () => {
    const ring: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const project = createProjector(ring, { width: 100, height: 100 }, 0);
    expect(project([0, 1]).y).toBeLessThan(project([0, 0]).y);
  });

  it('reuses the same frame for a subset of points (visible/hole arcs stay aligned)', () => {
    const ring: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const project = createProjector(ring, { width: 100, height: 100 }, 0);
    const [a, b] = projectPoints([ring[0], ring[2]], project);
    expect(a).toEqual(project(ring[0]));
    expect(b).toEqual(project(ring[2]));
  });

  it('fills a non-square rectangle on its shorter axis too (aspect ratio matched upstream by boardDimensionsFor)', () => {
    // A ring twice as tall as it is wide, projected into a canvas of the same 1:2 ratio: both
    // axes should reach the available edges, not just one.
    const ring: [number, number][] = [
      [0, -10],
      [10, -10],
      [10, 10],
      [0, 10],
    ];
    const project = createProjector(ring, { width: 50, height: 100 }, 0);
    expect(project([0, 10]).x).toBeCloseTo(0);
    expect(project([10, 10]).x).toBeCloseTo(50);
    expect(project([0, 10]).y).toBeCloseTo(0);
    expect(project([0, -10]).y).toBeCloseTo(100);
  });
});

describe('createUnprojector', () => {
  const ring: [number, number][] = [
    [0, -10],
    [10, -10],
    [10, 10],
    [0, 10],
  ];

  it('round-trips an arbitrary point through createProjector then back', () => {
    const size = { width: 100, height: 200 };
    const project = createProjector(ring, size, 10);
    const unproject = createUnprojector(ring, size, 10);
    const original: [number, number] = [4.2, -3.7];
    const roundTripped = unproject(project(original));
    expect(roundTripped[0]).toBeCloseTo(original[0]);
    expect(roundTripped[1]).toBeCloseTo(original[1]);
  });

  it('recovers each corner of the ring itself', () => {
    const size = { width: 50, height: 100 };
    const project = createProjector(ring, size, 0);
    const unproject = createUnprojector(ring, size, 0);
    ring.forEach((corner) => {
      const [lon, lat] = unproject(project(corner));
      expect(lon).toBeCloseTo(corner[0]);
      expect(lat).toBeCloseTo(corner[1]);
    });
  });
});

describe('boardDimensionsFor', () => {
  it('uses the full max width for a square-ish ring that already fits the max height', () => {
    const ring: [number, number][] = [
      [0, -5],
      [10, -5],
      [10, 5],
      [0, 5],
    ];
    const { width, height } = boardDimensionsFor(ring, 100, 200);
    expect(width).toBeCloseTo(100);
    expect(height).toBeCloseTo(100);
  });

  it('shrinks width (keeping the aspect ratio) for a tall, narrow ring capped by max height', () => {
    // 1:4 width:height ratio — at max width 100 that wants height 400, but height is capped at 120.
    const ring: [number, number][] = [
      [0, -20],
      [5, -20],
      [5, 20],
      [0, 20],
    ];
    const { width, height } = boardDimensionsFor(ring, 100, 120);
    expect(height).toBeCloseTo(120);
    expect(width).toBeLessThan(100);
    expect(height / width).toBeCloseTo(40 / 5, 0);
  });

  it('keeps a wide ring capped by max width, height following the aspect ratio', () => {
    const ring: [number, number][] = [
      [0, -2],
      [40, -2],
      [40, 2],
      [0, 2],
    ];
    const { width, height } = boardDimensionsFor(ring, 100, 500);
    expect(width).toBeCloseTo(100);
    expect(height).toBeLessThan(100);
  });
});

describe('polylinePath', () => {
  it('returns an empty string for no points', () => {
    expect(polylinePath([])).toBe('');
  });

  it('builds a single M command for one point', () => {
    expect(polylinePath([{ x: 1, y: 2 }])).toBe('M 1 2 ');
  });

  it('chains L commands for the rest of the points', () => {
    expect(polylinePath([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }])).toBe('M 0 0 L 1 1 L 2 2');
  });
});
