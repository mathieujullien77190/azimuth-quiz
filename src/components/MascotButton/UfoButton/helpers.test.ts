import { BLINK_PERIOD_MS, BOB_AMPLITUDE, BOB_PERIOD_MS, SPIN_DURATION_MS, SPIN_PERIOD_MS } from './constants';
import { ufoIdleFrame } from './helpers';

describe('ufoIdleFrame', () => {
  it('is at rest (bobY 0) at elapsed 0, with both blink phases mid-alternation, no spin', () => {
    const frame = ufoIdleFrame(0);
    expect(frame.bobY).toBeCloseTo(0);
    expect(frame.blinkOpacityA).toBeCloseTo(0.4 + 0.6 * 0.5);
    expect(frame.spinDeg).toBe(0);
  });

  it('does a full turn on itself over the first SPIN_DURATION_MS of every SPIN_PERIOD_MS', () => {
    expect(ufoIdleFrame(SPIN_DURATION_MS / 2).spinDeg).toBeCloseTo(180, 5);
    // Idle (no rotation) for the rest of the period.
    expect(ufoIdleFrame(SPIN_DURATION_MS).spinDeg).toBe(0);
    expect(ufoIdleFrame(SPIN_PERIOD_MS - 1).spinDeg).toBe(0);
    // The next period starts the same way.
    expect(ufoIdleFrame(SPIN_PERIOD_MS + SPIN_DURATION_MS / 2).spinDeg).toBeCloseTo(180, 5);
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
