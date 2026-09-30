import { BLINK_PERIOD_MS, BOB_AMPLITUDE, BOB_PERIOD_MS, GEAR_PERIOD_MS } from './constants';
import { ufoIdleFrame } from './helpers';

describe('ufoIdleFrame', () => {
  it('is at rest (bobY 0) at elapsed 0, with both blink phases mid-alternation, gear at 0', () => {
    const frame = ufoIdleFrame(0);
    expect(frame.bobY).toBeCloseTo(0);
    expect(frame.blinkOpacityA).toBeCloseTo(0.4 + 0.6 * 0.5);
    expect(frame.gearDeg).toBe(0);
  });

  it('turns the gear continuously, a full turn every GEAR_PERIOD_MS', () => {
    expect(ufoIdleFrame(GEAR_PERIOD_MS / 2).gearDeg).toBeCloseTo(180, 5);
    expect(ufoIdleFrame(GEAR_PERIOD_MS).gearDeg).toBe(0);
    expect(ufoIdleFrame(GEAR_PERIOD_MS * 3 + GEAR_PERIOD_MS / 4).gearDeg).toBeCloseTo(90, 5);
  });

  it('reaches peak bob amplitude a quarter period in', () => {
    const frame = ufoIdleFrame(BOB_PERIOD_MS / 4);
    expect(frame.bobY).toBeCloseTo(BOB_AMPLITUDE, 5);
  });

  it('alternates the two blink phases (A high when B low, half a blink period apart)', () => {
    const frame = ufoIdleFrame(BLINK_PERIOD_MS / 4);
    expect(frame.blinkOpacityA).toBeGreaterThan(frame.blinkOpacityB);
  });

  it('stays within the documented opacity range [0.4, 1]', () => {
    for (let t = 0; t < BLINK_PERIOD_MS * 2; t += 37) {
      const { blinkOpacityA, blinkOpacityB } = ufoIdleFrame(t);
      expect(blinkOpacityA).toBeGreaterThanOrEqual(0.4);
      expect(blinkOpacityA).toBeLessThanOrEqual(1);
      expect(blinkOpacityB).toBeGreaterThanOrEqual(0.4);
      expect(blinkOpacityB).toBeLessThanOrEqual(1);
    }
  });
});
