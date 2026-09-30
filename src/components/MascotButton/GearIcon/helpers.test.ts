import { GEAR_PERIOD_MS } from './constants';
import { gearAngleDeg } from './helpers';

describe('gearAngleDeg', () => {
  it('turns continuously, a full turn every GEAR_PERIOD_MS', () => {
    expect(gearAngleDeg(0)).toBe(0);
    expect(gearAngleDeg(GEAR_PERIOD_MS / 2)).toBeCloseTo(180, 5);
    expect(gearAngleDeg(GEAR_PERIOD_MS)).toBe(0);
    expect(gearAngleDeg(GEAR_PERIOD_MS * 3 + GEAR_PERIOD_MS / 4)).toBeCloseTo(90, 5);
  });
});
