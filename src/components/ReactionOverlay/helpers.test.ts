import { LANES, LANE_PX, WOBBLE_CYCLES, WOBBLE_PX, WOBBLE_STEPS } from './constants';
import { laneOffset, wobbleCurve } from './helpers';

describe('wobbleCurve', () => {
  it('samples a sine over the whole 0-1 timeline, starting and ending in the middle', () => {
    const { inputRange, outputRange } = wobbleCurve();
    expect(inputRange).toHaveLength(WOBBLE_STEPS + 1);
    expect(inputRange[0]).toBe(0);
    expect(inputRange[WOBBLE_STEPS]).toBe(1);
    expect(outputRange[0]).toBeCloseTo(0, 6);
    expect(outputRange[WOBBLE_STEPS]).toBeCloseTo(0, 6);
  });

  it('never drifts further than the wobble amplitude, and does reach it on both sides', () => {
    const { outputRange } = wobbleCurve();
    expect(Math.max(...outputRange)).toBeLessThanOrEqual(WOBBLE_PX + 1e-9);
    expect(Math.max(...outputRange)).toBeGreaterThan(WOBBLE_PX * 0.9);
    expect(Math.min(...outputRange)).toBeLessThan(-WOBBLE_PX * 0.9);
  });

  it('goes to and fro as many times as asked', () => {
    const { outputRange } = wobbleCurve();
    const crossings = outputRange.slice(1).filter((value, index) => Math.sign(value) * Math.sign(outputRange[index]) < 0);
    expect(crossings.length).toBeGreaterThanOrEqual(WOBBLE_CYCLES);
  });
});

describe('laneOffset', () => {
  it('spreads consecutive bubbles over the lanes, centred on the middle', () => {
    const offsets = Array.from({ length: LANES }, (_, seq) => laneOffset(seq));
    expect(new Set(offsets).size).toBe(LANES);
    expect(offsets.reduce((sum, offset) => sum + offset, 0)).toBeCloseTo(0, 6);
    expect(Math.max(...offsets)).toBe(((LANES - 1) / 2) * LANE_PX);
  });

  it('is the same for the same seq on every device, and comes round after all the lanes', () => {
    expect(laneOffset(12345)).toBe(laneOffset(12345));
    expect(laneOffset(3)).toBe(laneOffset(3 + LANES));
  });
});
