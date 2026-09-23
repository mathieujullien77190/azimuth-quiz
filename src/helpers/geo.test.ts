import { EARTH_RADIUS_KM } from '@/constants';

import {
  angleDifference,
  arcKmFromChordKm,
  arcKmFromInclination,
  bearingDeg,
  bearingToCardinal,
  centralAngleDeg,
  distanceKm,
  inclinationDeg,
  inclinationFromChordKm,
  normalizeBearing,
  straightDistanceKm,
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

describe('straightDistanceKm', () => {
  it('equals the Earth diameter for antipodal points', () => {
    expect(straightDistanceKm(paris, antipode)).toBeCloseTo(2 * EARTH_RADIUS_KM, 0);
  });

  it('is always <= the surface distance', () => {
    const tokyo = { latitude: 35.6762, longitude: 139.6503 };
    expect(straightDistanceKm(paris, tokyo)).toBeLessThanOrEqual(distanceKm(paris, tokyo));
  });
});

describe('inclinationDeg / arcKmFromInclination / arcKmFromChordKm', () => {
  it('is 90 for antipodal points (straight through the core)', () => {
    expect(inclinationDeg(paris, antipode)).toBeCloseTo(90, 0);
  });

  it('is 0 for identical points', () => {
    expect(inclinationDeg(paris, same)).toBeCloseTo(0, 5);
  });

  it('arcKmFromInclination(0) is 0 and arcKmFromInclination(90) is half the circumference', () => {
    expect(arcKmFromInclination(0)).toBeCloseTo(0, 5);
    expect(arcKmFromInclination(90)).toBeCloseTo(Math.PI * EARTH_RADIUS_KM, 0);
  });

  it('arcKmFromChordKm matches arcKmFromInclination(inclinationFromChordKm(x))', () => {
    const chord = 5000;
    expect(arcKmFromChordKm(chord)).toBeCloseTo(arcKmFromInclination(inclinationFromChordKm(chord)), 5);
  });
});

describe('inclinationFromChordKm', () => {
  it('is 90 for a chord equal to the Earth diameter', () => {
    expect(inclinationFromChordKm(2 * EARTH_RADIUS_KM)).toBeCloseTo(90, 5);
  });

  it('is 0 for a chord of length 0', () => {
    expect(inclinationFromChordKm(0)).toBeCloseTo(0, 5);
  });

  it('clamps chords longer than the diameter to 90', () => {
    expect(inclinationFromChordKm(10 * EARTH_RADIUS_KM)).toBeCloseTo(90, 5);
  });

  it('clamps negative chords to 0', () => {
    expect(inclinationFromChordKm(-100)).toBeCloseTo(0, 5);
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
