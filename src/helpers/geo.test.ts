import { EARTH_RADIUS_KM } from '@/data';

import {
  angleDifference,
  bearingDeg,
  bearingToCardinal,
  distanceKm,
  normalizeBearing,
  rhumbDestination,
  wrapLongitude,
} from './geo';

const paris = { latitude: 48.8566, longitude: 2.3522 };
const same = { latitude: 48.8566, longitude: 2.3522 };
const antipode = { latitude: -48.8566, longitude: -177.6478 };
const northPole = { latitude: 90, longitude: 0 };
const newYork = { latitude: 40.7128, longitude: -74.006 };

describe('wrapLongitude', () => {
  it('keeps a valid longitude and wraps the others', () => {
    expect(wrapLongitude(10)).toBeCloseTo(10);
    expect(wrapLongitude(190)).toBeCloseTo(-170);
    expect(wrapLongitude(-190)).toBeCloseTo(170);
    expect(wrapLongitude(540)).toBeCloseTo(-180);
  });
});

describe('distanceKm', () => {
  it('is 0 for identical points', () => {
    expect(distanceKm(paris, same)).toBeCloseTo(0, 5);
  });

  it('follows the parallel due east: 10 degrees of longitude at the latitude of Paris', () => {
    const east = { latitude: paris.latitude, longitude: paris.longitude + 10 };
    const parallel = ((10 * Math.PI) / 180) * Math.cos((paris.latitude * Math.PI) / 180) * EARTH_RADIUS_KM;
    expect(distanceKm(paris, east)).toBeCloseTo(parallel, 6);
  });

  it('goes straight up the meridian towards the pole', () => {
    expect(distanceKm(paris, northPole)).toBeCloseTo((((90 - paris.latitude) * Math.PI) / 180) * EARTH_RADIUS_KM, 0);
  });

  it('is longer than the shortest way: Paris to New York holding the same heading is about 6079 km, not 5837', () => {
    expect(distanceKm(paris, newYork)).toBeCloseTo(6079, -1);
  });

  it('goes beyond half the Earth circumference for antipodal points', () => {
    expect(distanceKm(paris, antipode)).toBeGreaterThan(Math.PI * EARTH_RADIUS_KM);
  });
});

describe('bearingDeg', () => {
  it('points due north up the same meridian', () => {
    expect(bearingDeg(paris, { latitude: 70, longitude: paris.longitude })).toBeCloseTo(0, 6);
  });

  it('points all but due north towards the pole, which is on another meridian', () => {
    expect(angleDifference(bearingDeg(paris, northPole), 0)).toBeLessThan(0.1);
  });

  it('points exactly due east along the same latitude (a straight heading stays on its parallel)', () => {
    const east = { latitude: paris.latitude, longitude: paris.longitude + 10 };
    expect(bearingDeg(paris, east)).toBeCloseTo(90, 6);
  });

  it('is the heading to hold all the way: Paris to New York is 261 degrees, not the 292 of the shortest way', () => {
    expect(bearingDeg(paris, newYork)).toBeCloseTo(261.4, 1);
  });

  it('takes the shorter way around the date line', () => {
    const near = { latitude: 0, longitude: 170 };
    const far = { latitude: 0, longitude: -170 };
    expect(bearingDeg(near, far)).toBeCloseTo(90, 6);
    expect(bearingDeg(far, near)).toBeCloseTo(270, 6);
  });

  it('returns a value in [0, 360)', () => {
    const value = bearingDeg(paris, antipode);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(360);
  });
});

describe('rhumbDestination', () => {
  it('stays put for a distance of 0', () => {
    const point = rhumbDestination(paris, 123, 0);
    expect(point.latitude).toBeCloseTo(paris.latitude, 6);
    expect(point.longitude).toBeCloseTo(paris.longitude, 6);
  });

  it('is the other way round from the heading and the distance it takes', () => {
    const point = rhumbDestination(paris, bearingDeg(paris, newYork), distanceKm(paris, newYork));
    expect(point.latitude).toBeCloseTo(newYork.latitude, 6);
    expect(point.longitude).toBeCloseTo(newYork.longitude, 6);
  });

  it('stays on its parallel going due east, and comes out on the other side of the date line', () => {
    const point = rhumbDestination({ latitude: 60, longitude: 170 }, 90, 1000);
    expect(point.latitude).toBeCloseTo(60, 6);
    expect(point.longitude).toBeCloseTo(-172.02, 1);
  });

  it('goes up the meridian heading north', () => {
    const point = rhumbDestination({ latitude: 0, longitude: 20 }, 0, (Math.PI / 4) * EARTH_RADIUS_KM);
    expect(point.latitude).toBeCloseTo(45, 6);
    expect(point.longitude).toBeCloseTo(20, 6);
  });

  it('stops at the pole: holding a heading never takes you past it', () => {
    const point = rhumbDestination(paris, 10, 20000);
    expect(point.latitude).toBeCloseTo(90, 6);
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
