import { CARDINAL_BEARINGS, TICK_STEP_DEG } from '../constants';
import { bearingFromTouch, buildTicks, cardinalPoints, needlePoints, polarToPoint } from '../helpers';

describe('cardinalPoints', () => {
  it('returns N/E/S fixed and the west label parameterized', () => {
    expect(cardinalPoints('O')).toEqual([
      { label: 'N', bearing: CARDINAL_BEARINGS.N },
      { label: 'E', bearing: CARDINAL_BEARINGS.E },
      { label: 'S', bearing: CARDINAL_BEARINGS.S },
      { label: 'O', bearing: CARDINAL_BEARINGS.W },
    ]);
  });
});

describe('polarToPoint', () => {
  it('places bearing 0 straight above the center', () => {
    expect(polarToPoint(50, 10, 0)).toEqual({ x: 50, y: 40 });
  });

  it('places bearing 90 to the right of the center', () => {
    const { x, y } = polarToPoint(50, 10, 90);
    expect(x).toBeCloseTo(60, 5);
    expect(y).toBeCloseTo(50, 5);
  });
});

describe('bearingFromTouch', () => {
  it('is 0 for a touch at the top center', () => {
    expect(bearingFromTouch(50, 0, 100)).toBe(0);
  });

  it('is 90 for a touch at the right, mid height', () => {
    expect(bearingFromTouch(100, 50, 100)).toBe(90);
  });

  it('is 180 for a touch at the bottom center', () => {
    expect(bearingFromTouch(50, 100, 100)).toBe(180);
  });

  it('is 270 for a touch at the left, mid height', () => {
    expect(bearingFromTouch(0, 50, 100)).toBe(270);
  });
});

describe('needlePoints', () => {
  it('builds the 4-point polygon string for a needle', () => {
    expect(needlePoints(50, 0, 10, 5, 2)).toBe('50,40 52,50 50,55 48,50');
  });
});

describe('buildTicks', () => {
  const ticks = buildTicks(100);

  it('produces one tick every TICK_STEP_DEG, covering the full circle', () => {
    expect(ticks).toHaveLength(360 / TICK_STEP_DEG);
  });

  it('classifies bearings multiple of 90 as cardinal', () => {
    const cardinal = ticks.filter((tick) => tick.kind === 'cardinal');
    expect(cardinal.map((tick) => tick.key)).toEqual(['0', '90', '180', '270']);
  });

  it('classifies bearings multiple of 45 (but not 90) as intercardinal', () => {
    const intercardinal = ticks.filter((tick) => tick.kind === 'intercardinal');
    expect(intercardinal.map((tick) => tick.key)).toEqual(['45', '135', '225', '315']);
  });

  it('classifies the rest as minor', () => {
    const minor = ticks.filter((tick) => tick.kind === 'minor');
    expect(minor).toHaveLength(360 / TICK_STEP_DEG - 4 - 4);
  });
});
