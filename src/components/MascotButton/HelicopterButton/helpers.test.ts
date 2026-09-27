import { BLINK_PERIOD_MS, BOB_AMPLITUDE, BOB_PERIOD_MS, ROTOR_PERIOD_MS } from './constants';
import { helicopterIdleFrame } from './helpers';

describe('helicopterIdleFrame', () => {
  it('is at rest (bobY 0) at elapsed 0, rotor at 0deg, blink mid-alternation', () => {
    const frame = helicopterIdleFrame(0);
    expect(frame.bobY).toBeCloseTo(0);
    expect(frame.rotorAngleDeg).toBe(0);
    expect(frame.blinkOpacity).toBeCloseTo(0.4 + 0.6 * 0.5);
  });

  it('reaches peak bob amplitude a quarter period in', () => {
    const frame = helicopterIdleFrame(BOB_PERIOD_MS / 4);
    expect(frame.bobY).toBeCloseTo(BOB_AMPLITUDE, 5);
  });

  it('completes one full rotor turn every ROTOR_PERIOD_MS', () => {
    expect(helicopterIdleFrame(ROTOR_PERIOD_MS / 2).rotorAngleDeg).toBeCloseTo(180, 5);
    expect(helicopterIdleFrame(ROTOR_PERIOD_MS).rotorAngleDeg).toBeCloseTo(0, 5);
  });

  it('stays within the documented opacity range [0.4, 1]', () => {
    for (let t = 0; t < BLINK_PERIOD_MS * 2; t += 37) {
      const { blinkOpacity } = helicopterIdleFrame(t);
      expect(blinkOpacity).toBeGreaterThanOrEqual(0.4);
      expect(blinkOpacity).toBeLessThanOrEqual(1);
    }
  });
});
