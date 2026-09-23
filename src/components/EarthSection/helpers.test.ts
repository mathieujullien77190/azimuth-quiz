import { EARTH_RADIUS_KM } from '@/constants';

import { MAX_ZOOM, ZOOM_STEPS } from './constants';
import { arcPath, fitZoom, markEnd, sideOf, surfaceAngle, surfacePoint } from './helpers';

describe('sideOf', () => {
  it('a bearing pointing east (90°) goes right', () => {
    expect(sideOf(90)).toBe(1);
  });

  it('a bearing pointing west (270°) goes left', () => {
    expect(sideOf(270)).toBe(-1);
  });

  it('a bearing pointing due north (0°) goes right (not strictly negative sine)', () => {
    expect(sideOf(0)).toBe(1);
  });
});

describe('surfacePoint', () => {
  it('places the point straight up from the center at angle 0', () => {
    const point = surfacePoint({ x: 100, y: 100 }, 50, 0);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(50);
  });

  it('places the point to the right for a positive angle', () => {
    const point = surfacePoint({ x: 100, y: 100 }, 50, Math.PI / 2);
    expect(point.x).toBeCloseTo(150);
    expect(point.y).toBeCloseTo(100);
  });
});

describe('surfaceAngle', () => {
  it('scales linearly with distance for small distances', () => {
    expect(surfaceAngle(EARTH_RADIUS_KM)).toBeCloseTo(1);
  });

  it('clamps at Math.PI for very large distances (over half the Earth)', () => {
    expect(surfaceAngle(EARTH_RADIUS_KM * Math.PI * 10)).toBe(Math.PI);
  });
});

describe('arcPath', () => {
  it('draws a small arc (large-arc-flag 0) to the right (sweep-flag 1) for side 1', () => {
    const path = arcPath({ x: 0, y: 0 }, 100, Math.PI / 4, 1);
    expect(path).toMatch(/^M 0 -100 A 100 100 0 0 1 /);
  });

  it('draws to the left (sweep-flag 0) for side -1', () => {
    const path = arcPath({ x: 0, y: 0 }, 100, Math.PI / 4, -1);
    expect(path).toMatch(/^M 0 -100 A 100 100 0 0 0 /);
  });

  it('sets the large-arc-flag to 1 when the angle exceeds half a circle', () => {
    const path = arcPath({ x: 0, y: 0 }, 100, Math.PI * 1.2, 1);
    expect(path).toMatch(/^M 0 -100 A 100 100 0 1 1 /);
  });
});

describe('markEnd', () => {
  it('combines side and surface angle to place the endpoint on the circle', () => {
    const end = markEnd({ bearing: 90, distanceKm: EARTH_RADIUS_KM }, { x: 0, y: 100 }, 100);
    const expected = surfacePoint({ x: 0, y: 100 }, 100, 1);
    expect(end.x).toBeCloseTo(expected.x);
    expect(end.y).toBeCloseTo(expected.y);
  });
});

describe('fitZoom', () => {
  it('picks the highest step that keeps every mark within the available space', () => {
    // A tiny offset compared to the available space allows the max zoom step.
    const zoom = fitZoom([{ x: 1, y: 1 }], 1000, 1000);
    expect(zoom).toBe(MAX_ZOOM);
  });

  it('falls back to 1 when even the lowest zoom step would overflow', () => {
    const zoom = fitZoom([{ x: 1000, y: 1000 }], 10, 10);
    expect(zoom).toBe(1);
  });

  it('picks an intermediate step matching the constraint', () => {
    // limit = 20 exactly matches a step of ZOOM_STEPS.
    const zoom = fitZoom([{ x: 5, y: 5 }], 100, 100);
    expect(ZOOM_STEPS).toContain(zoom);
    expect(zoom).toBeGreaterThan(1);
    expect(zoom).toBeLessThan(MAX_ZOOM);
  });

  it('handles an empty offsets array without throwing', () => {
    expect(fitZoom([], 100, 100)).toBe(MAX_ZOOM);
  });

  it('only considers the positive (downward) part of the y offset', () => {
    // Un offset y negatif (au-dessus du joueur) ne doit pas contraindre le zoom vertical.
    const zoom = fitZoom([{ x: 1, y: -1000 }], 1000, 10);
    expect(zoom).toBe(MAX_ZOOM);
  });
});
