import { EARTH_RADIUS_KM } from '@/data';

import {
  angleDifference,
  bearingDeg,
  bearingToCardinal,
  centralAngleDeg,
  distanceKm,
  normalizeBearing,
} from './geo';

const paris = { latitude: 48.8566, longitude: 2.3522 };
const same = { latitude: 48.8566, longitude: 2.3522 };
const antipode = { latitude: -48.8566, longitude: -177.6478 };
const northPole = { latitude: 90, longitude: 0 };

describe('distanceKm', () => {
  it('is 0 for identical points', () => {
    expect(distanceKm(paris, same)).toBeCloseTo(0, 5);
  });

  it('is close to half the Earth circumference for antipodal points', () => {
    expect(distanceKm(paris, antipode)).toBeCloseTo(Math.PI * EARTH_RADIUS_KM, 0);
  });
});

describe('centralAngleDeg', () => {
  it('is 180 for antipodal points', () => {
    expect(centralAngleDeg(paris, antipode)).toBeCloseTo(180, 0);
  });

  it('is 0 for identical points', () => {
    expect(centralAngleDeg(paris, same)).toBeCloseTo(0, 5);
  });
});

describe('bearingDeg', () => {
  it('points due north towards the pole', () => {
    expect(bearingDeg(paris, northPole)).toBeCloseTo(0, 0);
  });

  it('points due east along the same latitude', () => {
    const east = { latitude: paris.latitude, longitude: paris.longitude + 10 };
    expect(bearingDeg(paris, east)).toBeGreaterThan(80);
    expect(bearingDeg(paris, east)).toBeLessThan(100);
  });

  it('returns a value in [0, 360)', () => {
    const value = bearingDeg(paris, antipode);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(360);
  });
});

describe('normalizeBearing', () => {
  it('wraps values into [0, 360)', () => {
    expect(normalizeBearing(0)).toBe(0);
    expect(normalizeBearing(360)).toBe(0);
    expect(normalizeBearing(370)).toBe(10);
    expect(normalizeBearing(-10)).toBe(350);
    expect(normalizeBearing(-370)).toBe(350);
  });
});

describe('angleDifference', () => {
  it('is 0 for identical bearings', () => {
    expect(angleDifference(10, 10)).toBe(0);
  });

  it('takes the shorter way around', () => {
    expect(angleDifference(10, 350)).toBe(20);
    expect(angleDifference(350, 10)).toBe(20);
  });

  it('is 180 for opposite bearings', () => {
    expect(angleDifference(0, 180)).toBe(180);
  });
});

describe('bearingToCardinal', () => {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

  it('picks the nearest of 8 cardinal points', () => {
    expect(bearingToCardinal(0, cardinals)).toBe('N');
    expect(bearingToCardinal(44, cardinals)).toBe('NE');
    expect(bearingToCardinal(46, cardinals)).toBe('NE');
    expect(bearingToCardinal(180, cardinals)).toBe('S');
  });

  it('wraps 360 back to N', () => {
    expect(bearingToCardinal(360, cardinals)).toBe('N');
  });
});
