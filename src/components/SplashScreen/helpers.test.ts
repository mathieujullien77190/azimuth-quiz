import { buildProgressSteps } from './helpers';

/** A small deterministic random, so a look is the same from one run to the next. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const SEEDS = [1, 7, 42, 1234, 99999, 2026];
const MIN_MS = 5000;

describe('buildProgressSteps', () => {
  it.each(SEEDS)('is in time order, never overlapping, and only ever goes forward (seed %i)', (seed) => {
    const steps = buildProgressSteps(MIN_MS, seeded(seed));
    steps.forEach((step, index) => {
      expect(step.easeMs).toBeGreaterThan(0);
      expect(step.to).toBeGreaterThan(0);
      if (index === 0) return;
      const previous = steps[index - 1];
      expect(step.at).toBeGreaterThanOrEqual(previous.at + previous.easeMs);
      expect(step.to).toBeGreaterThan(previous.to);
    });
  });

  it.each(SEEDS)('ends exactly at the minimum time, on a value under 100 (seed %i)', (seed) => {
    const steps = buildProgressSteps(MIN_MS, seeded(seed));
    const last = steps[steps.length - 1];
    expect(last.at + last.easeMs).toBe(MIN_MS);
    expect(last.to).toBeLessThan(100);
    expect(last.to).toBeGreaterThanOrEqual(96);
  });

  it.each(SEEDS)('has stalls: at least three plateaus of 100 ms or more (seed %i)', (seed) => {
    const steps = buildProgressSteps(MIN_MS, seeded(seed));
    const gaps = steps.map((step, index) => step.at - (index === 0 ? 0 : steps[index - 1].at + steps[index - 1].easeMs));
    expect(gaps.filter((gap) => gap >= 100).length).toBeGreaterThanOrEqual(3);
  });

  it('has a long stall near two thirds, before the burst to the end', () => {
    const steps = buildProgressSteps(MIN_MS, seeded(42));
    const stalled = steps.findIndex((step) => step.to >= 60 && step.to <= 72);
    const burst = steps[stalled + 1];
    expect(burst.at - (steps[stalled].at + steps[stalled].easeMs)).toBeGreaterThanOrEqual(0.1 * MIN_MS);
    expect(burst.to).toBeGreaterThanOrEqual(85);
  });

  it('does not look the same from one launch to the next, but is the same for the same random', () => {
    expect(buildProgressSteps(MIN_MS, seeded(1))).toEqual(buildProgressSteps(MIN_MS, seeded(1)));
    expect(buildProgressSteps(MIN_MS, seeded(1))).not.toEqual(buildProgressSteps(MIN_MS, seeded(2)));
  });

  it('keeps its shape whatever the random says (the lowest and the highest draw)', () => {
    [() => 0, () => 0.999999].forEach((random) => {
      const steps = buildProgressSteps(MIN_MS, random);
      const last = steps[steps.length - 1];
      expect(last.at + last.easeMs).toBe(MIN_MS);
      steps.forEach((step, index) => {
        if (index > 0) expect(step.at).toBeGreaterThanOrEqual(steps[index - 1].at + steps[index - 1].easeMs);
      });
    });
  });

  it('uses Math.random when no random is given', () => {
    const steps = buildProgressSteps(MIN_MS);
    expect(steps).toHaveLength(7);
  });

  it('scales with the minimum time', () => {
    const steps = buildProgressSteps(10000, seeded(42));
    const last = steps[steps.length - 1];
    expect(last.at + last.easeMs).toBe(10000);
  });
});
