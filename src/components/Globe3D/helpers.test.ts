import { EARTH_RADIUS_KM } from '@/data';
import { rhumbDestination } from '@/helpers/geo';

import { MAX_CENTER_LATITUDE, MAX_ZOOM, MIN_ZOOM } from './constants';
import {
  centerOn,
  dragCenter,
  equatorPoints,
  fingerGap,
  greatCirclePoint,
  greenwichPoints,
  orbitPoint,
  parseRings,
  polylinePositions,
  routePoints,
  scenePoint,
  screenPoint,
  viewPoint,
  zoomedBy,
} from './helpers';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe('greatCirclePoint', () => {
  it('stays put for a distance of 0', () => {
    const point = greatCirclePoint(PARIS, 123, 0);
    expect(point.latitude).toBeCloseTo(PARIS.latitude, 6);
    expect(point.longitude).toBeCloseTo(PARIS.longitude, 6);
  });

  it('goes up the same meridian heading north, a quarter of the Earth away reaches the pole', () => {
    const point = greatCirclePoint({ latitude: 0, longitude: 20 }, 0, (Math.PI / 2) * EARTH_RADIUS_KM);
    expect(point.latitude).toBeCloseTo(90, 4);
  });

  it('follows the equator heading east', () => {
    const point = greatCirclePoint({ latitude: 0, longitude: 0 }, 90, (Math.PI / 2) * EARTH_RADIUS_KM);
    expect(point.latitude).toBeCloseTo(0, 6);
    expect(point.longitude).toBeCloseTo(90, 4);
  });

  it('comes out on the other side of the date line', () => {
    const point = greatCirclePoint({ latitude: 0, longitude: 170 }, 90, (Math.PI / 9) * EARTH_RADIUS_KM);
    expect(point.longitude).toBeCloseTo(-170, 3);
  });

  it('takes the shortest way: Paris to New York is 5837 km, leaving on a heading of 291 degrees', () => {
    const point = greatCirclePoint(PARIS, 291.6, 5837);
    expect(point.latitude).toBeCloseTo(40.7, 0);
    expect(point.longitude).toBeCloseTo(-74, 0);
  });
});

describe('routePoints', () => {
  it('goes from the origin to the destination in `steps` segments', () => {
    const points = routePoints(PARIS, 261.4, 6079, 8);
    expect(points).toHaveLength(9);
    expect(points[0].latitude).toBeCloseTo(PARIS.latitude, 6);
    expect(points[8]).toEqual(rhumbDestination(PARIS, 261.4, 6079));
  });

  it('holds its heading all along: due east it stays on its parallel, at even steps of longitude', () => {
    const points = routePoints({ latitude: 40, longitude: -100 }, 90, 9000, 2);
    expect(points[1].latitude).toBeCloseTo(40, 6);
    expect(points[1].longitude - points[0].longitude).toBeCloseTo(points[2].longitude - points[1].longitude, 6);
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

describe('scenePoint', () => {
  it('puts the Greenwich meridian in front of the camera, the north pole up and the east on the right', () => {
    expect(scenePoint(ORIGIN)).toEqual([0, 0, 1]);
    const [x, y, z] = scenePoint({ latitude: 90, longitude: 0 });
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
    expect(z).toBeCloseTo(0);
    expect(scenePoint({ latitude: 0, longitude: 90 })[0]).toBeCloseTo(1);
    expect(scenePoint({ latitude: 0, longitude: -90 })[0]).toBeCloseTo(-1);
  });

  it('is on a ball of radius 1, or of `altitude` when asked', () => {
    expect(Math.hypot(...scenePoint(PARIS))).toBeCloseTo(1, 6);
    expect(Math.hypot(...scenePoint(PARIS, 1.5))).toBeCloseTo(1.5, 6);
  });

});

describe('polylinePositions', () => {
  it('lays every point out in a row, three numbers each', () => {
    const positions = polylinePositions([ORIGIN, { latitude: 0, longitude: 90 }], 1);
    expect(positions).toHaveLength(6);
    expect(positions.slice(0, 3)).toEqual([0, 0, 1]);
    expect(positions[3]).toBeCloseTo(1);
  });
});

describe('zoomedBy', () => {
  it('multiplies the zoom', () => {
    expect(zoomedBy(2, 1.5)).toBe(3);
  });

  it('never goes past the limits', () => {
    expect(zoomedBy(1, 0.1)).toBe(MIN_ZOOM);
    expect(zoomedBy(4, 100)).toBe(MAX_ZOOM);
  });
});

describe('fingerGap', () => {
  it('is how far apart two fingers are', () => {
    expect(fingerGap([{ pageX: 0, pageY: 0 }, { pageX: 3, pageY: 4 }])).toBe(5);
  });

  it('is nothing with a single finger on the glass', () => {
    expect(fingerGap([{ pageX: 0, pageY: 0 }])).toBeNull();
    expect(fingerGap([])).toBeNull();
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
