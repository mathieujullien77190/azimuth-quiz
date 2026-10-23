import { SWAY_DECAY, SWAY_LEGS, SWAY_SAMPLES_PER_LEG, SWAY_START_DEG } from '../constants';
import { angleAt, SWAY_CURVE } from '../helpers';

describe('SWAY_CURVE', () => {
  const { inputRange, outputRange } = SWAY_CURVE;

  it('va de 0 a 1 et finit exactement au nord', () => {
    expect(inputRange[0]).toBe(0);
    expect(inputRange[inputRange.length - 1]).toBe(1);
    expect(outputRange[0]).toBe(0);
    expect(outputRange[outputRange.length - 1]).toBe(0);
    expect(outputRange).toHaveLength(SWAY_LEGS * SWAY_SAMPLES_PER_LEG + 1);
  });

  it("monte au premier sommet sans depasser l'ecart de depart", () => {
    const peak = Math.max(...outputRange);
    expect(peak).toBeLessThanOrEqual(SWAY_START_DEG);
    expect(peak).toBeGreaterThan(SWAY_START_DEG * SWAY_DECAY);
  });

  it('passe de chaque cote du nord et se rapproche de lui a chaque sens', () => {
    const peaks = Array.from({ length: SWAY_LEGS }, (_, leg) => {
      const slice = outputRange.slice(leg * SWAY_SAMPLES_PER_LEG, (leg + 1) * SWAY_SAMPLES_PER_LEG + 1);
      return slice.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
    });
    peaks.slice(1).forEach((peak, index) => {
      expect(Math.sign(peak)).toBe(-Math.sign(peaks[index]));
      expect(Math.abs(peak)).toBeLessThan(Math.abs(peaks[index]));
    });
    expect(Math.abs(peaks[peaks.length - 1])).toBeLessThan(1);
  });
});

describe('angleAt', () => {
  it("retrouve les points de la courbe et interpole entre deux d'entre eux", () => {
    expect(angleAt(0)).toBe(0);
    expect(angleAt(1)).toBe(0);
    const { outputRange } = SWAY_CURVE;
    const middle = angleAt(0.5 / (SWAY_LEGS * SWAY_SAMPLES_PER_LEG));
    expect(middle).toBeCloseTo(outputRange[1] / 2);
  });

  it('borne un avancement hors de 0..1', () => {
    expect(angleAt(-1)).toBe(0);
    expect(angleAt(2)).toBe(0);
  });
});
