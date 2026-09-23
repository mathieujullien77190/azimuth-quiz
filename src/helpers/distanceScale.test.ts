import { MIN_DISTANCE_KM } from '@/constants';

import { kmToRatio, ratioToKm } from './distanceScale';

describe('ratioToKm', () => {
  it('returns MIN_DISTANCE_KM at ratio 0', () => {
    expect(ratioToKm(0, 20000)).toBe(MIN_DISTANCE_KM);
  });

  it('returns maxKm at ratio 1, unrounded', () => {
    expect(ratioToKm(1, 12742)).toBe(12742);
  });

  it('clamps ratios outside [0, 1]', () => {
    expect(ratioToKm(-1, 20000)).toBe(MIN_DISTANCE_KM);
    expect(ratioToKm(2, 20000)).toBe(20000);
  });

  it('rounds intermediate values to a readable step', () => {
    // km < 100 -> pas de 5
    expect(ratioToKm(0.3, 20000) % 5).toBe(0);
    // km >= 1000 -> pas de 50 (verifie via une valeur qu'on sait grande)
    expect(ratioToKm(0.9, 20000) % 10).toBe(0);
  });

  it('never exceeds maxKm nor drops below MIN_DISTANCE_KM after rounding', () => {
    for (let ratio = 0; ratio <= 1; ratio += 0.05) {
      const km = ratioToKm(ratio, 20000);
      expect(km).toBeGreaterThanOrEqual(MIN_DISTANCE_KM);
      expect(km).toBeLessThanOrEqual(20000);
    }
  });
});

describe('kmToRatio', () => {
  it('is the inverse of ratioToKm at the extremes', () => {
    expect(kmToRatio(MIN_DISTANCE_KM, 20000)).toBeCloseTo(0, 5);
    expect(kmToRatio(20000, 20000)).toBeCloseTo(1, 5);
  });

  it('clamps to [0, 1] for out-of-range km', () => {
    expect(kmToRatio(1, 20000)).toBe(0);
    expect(kmToRatio(1_000_000, 20000)).toBe(1);
  });
});
