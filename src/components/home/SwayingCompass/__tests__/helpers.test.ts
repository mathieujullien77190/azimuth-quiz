import { SWAY_DECAY, SWAY_LEGS, SWAY_SAMPLES_PER_LEG, SWAY_START_DEG } from '../constants';
import { angleAt, buildCurve, isRising, kickPhase, REST_CURVE } from '../helpers';

const SAMPLES = SWAY_LEGS * SWAY_SAMPLES_PER_LEG;

describe('REST_CURVE', () => {
  const { inputRange, outputRange } = REST_CURVE;

  it('va de 0 a 1 et finit exactement au nord', () => {
    expect(inputRange[0]).toBe(0);
    expect(inputRange[inputRange.length - 1]).toBe(1);
    expect(outputRange[0]).toBe(0);
    expect(outputRange[outputRange.length - 1]).toBe(0);
    expect(outputRange).toHaveLength(SAMPLES + 1);
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
    expect(angleAt(REST_CURVE, 0)).toBe(0);
    expect(angleAt(REST_CURVE, 1)).toBe(0);
    expect(angleAt(REST_CURVE, 0.5 / SAMPLES)).toBeCloseTo(REST_CURVE.outputRange[1] / 2);
  });

  it('borne un avancement hors de 0..1', () => {
    expect(angleAt(REST_CURVE, -1)).toBe(0);
    expect(angleAt(REST_CURVE, 2)).toBe(0);
  });
});

describe('isRising', () => {
  it("dit dans quel sens va l'aiguille", () => {
    expect(isRising(REST_CURVE, 0.001)).toBe(true);
    // Apres le premier sommet (a mi-sens), l'angle diminue.
    expect(isRising(REST_CURVE, 0.75 / SWAY_LEGS)).toBe(false);
  });

  it("considere l'aiguille immobile comme montante", () => {
    expect(isRising(REST_CURVE, 1)).toBe(true);
  });
});

describe('kickPhase', () => {
  it("donne une courbe qui commence a l'angle voulu et dans le meme sens", () => {
    for (const angle of [-40, -10, 0, 25, 50]) {
      for (const rising of [true, false]) {
        const curve = buildCurve(kickPhase(angle, rising));
        expect(curve.outputRange[0]).toBeCloseTo(angle);
        expect(curve.outputRange[1] >= curve.outputRange[0]).toBe(rising);
      }
    }
  });

  it("repart avec tout l'ecart de depart: plus loin que l'aiguille presque calmee", () => {
    const calm = angleAt(REST_CURVE, 0.9);
    const curve = buildCurve(kickPhase(calm, isRising(REST_CURVE, 0.9)));
    expect(Math.max(...curve.outputRange.map(Math.abs))).toBeGreaterThan(Math.abs(calm) * 5);
  });

  it('borne un angle plus grand que l\'ecart maximal', () => {
    expect(kickPhase(999, true)).toBeCloseTo(Math.PI / 2);
  });
});
