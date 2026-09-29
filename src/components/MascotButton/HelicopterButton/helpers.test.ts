import {
  BLINK_PERIOD_MS,
  BOB_AMPLITUDE,
  BOB_PERIOD_MS,
  ROTOR_PERIOD_MS,
  SPIN_DURATION_MS,
  SPIN_PERIOD_MS,
} from './constants';
import { helicopterIdleFrame } from './helpers';

describe('helicopterIdleFrame', () => {
  it('is at rest (bobY 0) at elapsed 0, rotor at 0deg, blink mid-alternation, no spin', () => {
    const frame = helicopterIdleFrame(0);
    expect(frame.bobY).toBeCloseTo(0);
    expect(frame.rotorAngleDeg).toBe(0);
    expect(frame.blinkOpacity).toBeCloseTo(0.4 + 0.6 * 0.5);
    expect(frame.spinDeg).toBe(0);
  });

  it('does a full turn on itself over the first SPIN_DURATION_MS of every SPIN_PERIOD_MS', () => {
    expect(helicopterIdleFrame(SPIN_DURATION_MS / 2).spinDeg).toBeCloseTo(180, 5);
    // Idle (no rotation) for the rest of the period.
    expect(helicopterIdleFrame(SPIN_DURATION_MS).spinDeg).toBe(0);
    expect(helicopterIdleFrame(SPIN_PERIOD_MS - 1).spinDeg).toBe(0);
    // The next period starts the same way.
    expect(helicopterIdleFrame(SPIN_PERIOD_MS + SPIN_DURATION_MS / 2).spinDeg).toBeCloseTo(180, 5);
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
