import { EARTH_RADIUS_KM } from '@/data';

import { MAX_CENTER_LATITUDE } from './constants';
import {
  centerOn,
  destinationPoint,
  routePoints,
  wrapLongitude,
  dragCenter,
  equatorPoints,
  greenwichPoints,
  landPath,
  orbitPoint,
  parseRings,
  routePaths,
  screenPoint,
  viewPoint,
} from './helpers';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe('wrapLongitude', () => {
  it('keeps a valid longitude and wraps the others', () => {
    expect(wrapLongitude(10)).toBeCloseTo(10);
    expect(wrapLongitude(190)).toBeCloseTo(-170);
    expect(wrapLongitude(-190)).toBeCloseTo(170);
    expect(wrapLongitude(540)).toBeCloseTo(-180);
  });
});

describe('destinationPoint', () => {
  it('stays put for a distance of 0', () => {
    const point = destinationPoint(PARIS, 123, 0);
    expect(point.latitude).toBeCloseTo(PARIS.latitude, 6);
    expect(point.longitude).toBeCloseTo(PARIS.longitude, 6);
  });

  it('goes up the same meridian heading north, a quarter of the Earth away reaches the pole', () => {
    const point = destinationPoint({ latitude: 0, longitude: 20 }, 0, (Math.PI / 2) * EARTH_RADIUS_KM);
    expect(point.latitude).toBeCloseTo(90, 4);
  });

  it('follows the equator heading east', () => {
    const point = destinationPoint({ latitude: 0, longitude: 0 }, 90, (Math.PI / 2) * EARTH_RADIUS_KM);
    expect(point.latitude).toBeCloseTo(0, 6);
    expect(point.longitude).toBeCloseTo(90, 4);
  });

  it('comes out on the other side of the date line', () => {
    const point = destinationPoint({ latitude: 0, longitude: 170 }, 90, (Math.PI / 9) * EARTH_RADIUS_KM);
    expect(point.longitude).toBeCloseTo(-170, 3);
  });

  it('lands on a known place: Paris to New York is about 5837 km on a heading of 291 degrees', () => {
    const point = destinationPoint(PARIS, 291.6, 5837);
    expect(point.latitude).toBeCloseTo(40.7, 0);
    expect(point.longitude).toBeCloseTo(-74, 0);
  });
});

describe('routePoints', () => {
  it('goes from the origin to the destination in `steps` segments', () => {
    const points = routePoints(PARIS, 291.6, 5837, 8);
    expect(points).toHaveLength(9);
    expect(points[0].latitude).toBeCloseTo(PARIS.latitude, 6);
    expect(points[8]).toEqual(destinationPoint(PARIS, 291.6, 5837));
  });

  it('is not a straight line on a flat map: heading due east it starts at its northernmost point then curves back', () => {
    const middle = routePoints({ latitude: 40, longitude: -100 }, 90, 9000, 2)[1];
    expect(middle.latitude).toBeLessThan(40);
  });
});

const ORIGIN = { latitude: 0, longitude: 0 };

describe('parseRings', () => {
  it('reads every ring of the outline as coordinates', () => {
    expect(parseRings('M0 1L10 2L10 -3ZM5 5L6 6L7 5Z')).toEqual([
      [
        { latitude: 1, longitude: 0 },
        { latitude: 2, longitude: 10 },
        { latitude: -3, longitude: 10 },
      ],
      [
        { latitude: 5, longitude: 5 },
        { latitude: 6, longitude: 6 },
        { latitude: 5, longitude: 7 },
      ],
    ]);
  });
});

describe('viewPoint', () => {
  it('puts the centre right in front of the viewer', () => {
    const view = viewPoint(ORIGIN, ORIGIN);
    expect(view.x).toBeCloseTo(0);
    expect(view.y).toBeCloseTo(0);
    expect(view.z).toBeCloseTo(1);
  });

  it('puts 90 degrees east on the right edge and the north pole at the top', () => {
    const east = viewPoint({ latitude: 0, longitude: 90 }, ORIGIN);
    expect(east.x).toBeCloseTo(1);
    expect(east.z).toBeCloseTo(0);
    expect(viewPoint({ latitude: 90, longitude: 0 }, ORIGIN).y).toBeCloseTo(1);
  });

  it('puts the far side behind the globe', () => {
    expect(viewPoint({ latitude: 0, longitude: 180 }, ORIGIN).z).toBeCloseTo(-1);
  });
});

describe('screenPoint', () => {
  it('draws the centre in the middle of the drawing', () => {
    const point = screenPoint(ORIGIN, ORIGIN, 100, 100, 50);
    expect(point.visible).toBe(true);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(100);
  });

  it('pushes a point of the far side back to the outline, in its own direction', () => {
    const point = screenPoint({ latitude: 0, longitude: 120 }, ORIGIN, 100, 100, 50);
    expect(point.visible).toBe(false);
    expect(point.x).toBeCloseTo(150);
    expect(point.y).toBeCloseTo(100);
  });

  it('does not divide by zero for the point right behind the centre', () => {
    const point = screenPoint({ latitude: 0, longitude: 180 }, ORIGIN, 100, 100, 50);
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
  });
});

describe('landPath', () => {
  const ring = [
    { latitude: 0, longitude: -10 },
    { latitude: 10, longitude: 0 },
    { latitude: 0, longitude: 10 },
  ];
  const behind = ring.map((point) => ({ ...point, longitude: point.longitude + 180 }));
  const arcs = (d: string) => d.match(/A50 50 0 [01] [01]/g) ?? [];
  /** Every point of the path that is not an arc's radius or flags (those are drawn from the outline, not placed). */
  const points = (d: string) =>
    (d.replace(/A[^LZ]*/g, '').match(/-?\d+\.\d \d+\.\d/g) ?? []).map((pair) => pair.split(' ').map(Number));
  const inside = (d: string) =>
    points(d).forEach(([x, y]) => expect(Math.hypot(x - 100, y - 100)).toBeLessThanOrEqual(50.1));

  it('draws a ring that is in front through its points, with no arc', () => {
    const d = landPath([ring], ORIGIN, 100, 100, 50);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/L/g)).toHaveLength(2);
    expect(arcs(d)).toEqual([]);
  });

  it('skips a ring that is entirely behind the globe', () => {
    expect(landPath([behind], ORIGIN, 100, 100, 50)).toBe('');
  });

  it('cuts a ring at the outline and follows the outline where it goes behind the globe', () => {
    const cut = [ring[0], { latitude: 40, longitude: 150 }, ring[2]];
    const d = landPath([cut], ORIGIN, 100, 100, 50);
    expect(arcs(d)).toHaveLength(1);
    inside(d);
  });

  it('draws the same piece whichever point of the ring comes first', () => {
    const cut = [ring[0], { latitude: 40, longitude: 150 }, ring[2]];
    const shifted = [cut[1], cut[2], cut[0]];
    expect(arcs(landPath([shifted], ORIGIN, 100, 100, 50))).toHaveLength(1);
    inside(landPath([shifted], ORIGIN, 100, 100, 50));
  });

  it('runs the outline the other way, with the other flag, for a ring that goes the other way round', () => {
    const cut = [ring[0], { latitude: 40, longitude: 150 }, ring[2]];
    const [one = ''] = arcs(landPath([cut], ORIGIN, 100, 100, 50));
    const [other = ''] = arcs(landPath([[...cut].reverse()], ORIGIN, 100, 100, 50));
    expect(one.slice(-1)).not.toBe(other.slice(-1));
  });

  it('takes the short arc of the outline for a thin piece that dips in front of the globe', () => {
    const dip = [
      { latitude: 0, longitude: -60 },
      { latitude: 5, longitude: 100 },
      { latitude: 0, longitude: 60 },
    ];
    expect(arcs(landPath([dip], ORIGIN, 100, 100, 50))[0]?.[9]).toBe('0');
  });

  it('joins the stretches of coast that stay in front, each to the next one met along the outline', () => {
    // Two peninsulas poking out in front of the globe from a land mass that is behind it.
    const bays = [
      { latitude: 0, longitude: 100 },
      { latitude: 30, longitude: 60 },
      { latitude: 60, longitude: 100 },
      { latitude: 0, longitude: 100 },
      { latitude: -30, longitude: 60 },
      { latitude: -60, longitude: 100 },
    ];
    const d = landPath([bays], ORIGIN, 100, 100, 50);
    expect(arcs(d)).toHaveLength(2);
    expect(d.match(/M/g)).toHaveLength(2);
    inside(d);
  });
});

describe('routePaths', () => {
  const around = [0, 45, 90, 135, 180, 225, 270, 315, 360].map((longitude) => ({ latitude: 0, longitude }));

  it('keeps one piece for a route that stays in front', () => {
    expect(routePaths(around.slice(0, 3), ORIGIN, 100, 100, 50)).toHaveLength(1);
  });

  it('cuts the route where it goes behind the globe and starts again where it comes back', () => {
    const paths = routePaths(around, ORIGIN, 100, 100, 50);
    expect(paths).toHaveLength(2);
    expect(paths[0].startsWith('M 100 100')).toBe(true);
    expect(paths[1].startsWith('M ')).toBe(true);
  });

  it('draws nothing for a route that stays behind', () => {
    expect(routePaths(around.slice(3, 6), ORIGIN, 100, 100, 50)).toEqual([]);
  });

  it('starts at the outline for a route that begins behind and comes to the front', () => {
    const paths = routePaths(around.slice(5, 9), ORIGIN, 100, 100, 50);
    expect(paths).toHaveLength(1);
    expect(paths[0].split('M')).toHaveLength(2);
  });
});

describe('centerOn', () => {
  it('is the middle of two points', () => {
    const center = centerOn([ORIGIN, { latitude: 0, longitude: 90 }]);
    expect(center.latitude).toBeCloseTo(0);
    expect(center.longitude).toBeCloseTo(45);
  });

  it('falls back on the first point when they cancel out', () => {
    expect(centerOn([ORIGIN, { latitude: 0, longitude: 180 }])).toBe(ORIGIN);
  });
});

describe('dragCenter', () => {
  const radius = 100;
  const tenDegrees = radius * ((10 * Math.PI) / 180);

  it('turns the globe the other way from the finger', () => {
    const moved = dragCenter({ latitude: 20, longitude: 30 }, tenDegrees, tenDegrees, radius);
    expect(moved.longitude).toBeCloseTo(20);
    expect(moved.latitude).toBeCloseTo(30);
  });

  it('keeps the centre short of the poles', () => {
    expect(dragCenter(ORIGIN, 0, 1e6, radius).latitude).toBe(MAX_CENTER_LATITUDE);
    expect(dragCenter(ORIGIN, 0, -1e6, radius).latitude).toBe(-MAX_CENTER_LATITUDE);
  });
});

describe('orbitPoint', () => {
  const at = (degrees: number) => orbitPoint(ORIGIN, 90, (degrees * Math.PI) / 180, ORIGIN, 100, 100, 50, 1.12);

  it('starts right above the starting point', () => {
    const point = at(0);
    expect(point.visible).toBe(true);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(100);
  });

  it('flies higher than the ground: seen above the outline at 90 degrees', () => {
    expect(at(90).x).toBeCloseTo(100 + 50 * 1.12);
  });

  it('is still seen just behind the globe, as long as it is out of the way of the globe', () => {
    expect(at(100).visible).toBe(true);
  });

  it('is hidden by the globe when it is right behind it', () => {
    expect(at(180).visible).toBe(false);
  });
});

describe('equatorPoints', () => {
  it('goes right round the Earth along latitude 0', () => {
    const points = equatorPoints(90);
    expect(points).toHaveLength(5);
    expect(points.every((point) => point.latitude === 0)).toBe(true);
    expect(points.map((point) => point.longitude)).toEqual([-180, -90, 0, 90, 180]);
  });
});

describe('greenwichPoints', () => {
  it('goes from pole to pole along longitude 0', () => {
    const points = greenwichPoints(90);
    expect(points.map((point) => point.latitude)).toEqual([-90, 0, 90]);
    expect(points.every((point) => point.longitude === 0)).toBe(true);
  });
});
