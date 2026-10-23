import {
  SPIN_AFTER_LEGS_MAX,
  SPIN_AFTER_LEGS_MIN,
  SPIN_EASE_MS,
  SPIN_TURN_MS,
  SPIN_TURNS_MAX,
  SPIN_TURNS_MIN,
  SWAY_DECAY,
  SWAY_LEGS,
  SWAY_SAMPLES_PER_LEG,
  SWAY_START_DEG,
  SWAY_TOTAL_MS,
} from '../constants';
import { angleAt, buildCurve, PEAK_CURVE, planCycle, REST_CURVE } from '../helpers';

const SAMPLES = SWAY_LEGS * SWAY_SAMPLES_PER_LEG;

describe('REST_CURVE', () => {
  const { inputRange, outputRange } = REST_CURVE;

  it('va de 0 a 1, part du nord et garde la taille attendue', () => {
    expect(inputRange[0]).toBe(0);
    expect(inputRange[inputRange.length - 1]).toBe(1);
    expect(outputRange[0]).toBe(0);
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
  });
});

describe('PEAK_CURVE', () => {
  it("part du sommet haut, a l'arret: peu de chemin sur le premier point, puis passe de l'autre cote", () => {
    expect(PEAK_CURVE.outputRange[0]).toBeCloseTo(SWAY_START_DEG);
    expect(SWAY_START_DEG - PEAK_CURVE.outputRange[1]).toBeLessThan(4);
    expect(PEAK_CURVE.outputRange[SWAY_SAMPLES_PER_LEG]).toBeLessThan(0);
  });
});

describe('buildCurve', () => {
  it('est un balancier amorti: sin(0) = 0 sans dephasage', () => {
    expect(buildCurve(0).outputRange[0]).toBeCloseTo(0);
  });
});

describe('angleAt', () => {
  it("retrouve les points de la courbe et interpole entre deux d'entre eux", () => {
    expect(angleAt(REST_CURVE, 0)).toBe(0);
    expect(angleAt(REST_CURVE, 0.5 / SAMPLES)).toBeCloseTo(REST_CURVE.outputRange[1] / 2);
    expect(angleAt(REST_CURVE, 1)).toBeCloseTo(REST_CURVE.outputRange[SAMPLES]);
  });

  it('borne un avancement hors de 0..1', () => {
    expect(angleAt(REST_CURVE, -1)).toBe(0);
    expect(angleAt(REST_CURVE, 2)).toBeCloseTo(REST_CURVE.outputRange[SAMPLES]);
  });
});

describe('planCycle', () => {
  it("s'arrete sur un sommet de la courbe en cours, le premier cycle etant a mi-sens", () => {
    const plan = planCycle(true, () => 0);
    expect(plan.swayTo).toBeCloseTo((SPIN_AFTER_LEGS_MIN + 0.5) / SWAY_LEGS);
    expect(plan.swayMs).toBeCloseTo(plan.swayTo * SWAY_TOTAL_MS);
    // Un sommet: les points voisins sont tous deux plus bas en valeur absolue.
    const index = Math.round(plan.swayTo * SAMPLES);
    const values = REST_CURVE.outputRange.map(Math.abs);
    expect(values[index]).toBeGreaterThan(values[index - 1]);
    expect(values[index]).toBeGreaterThan(values[index + 1]);
  });

  it("les cycles suivants s'arretent sur un sommet de PEAK_CURVE, aux sens entiers", () => {
    const plan = planCycle(false, () => 0);
    expect(plan.swayTo).toBeCloseTo(SPIN_AFTER_LEGS_MIN / SWAY_LEGS);
    const index = Math.round(plan.swayTo * SAMPLES);
    const values = PEAK_CURVE.outputRange.map(Math.abs);
    expect(values[index]).toBeGreaterThan(values[index - 1]);
    expect(values[index]).toBeGreaterThan(values[index + 1]);
  });

  it("choisit l'attente entre les bornes, a l'ecart reduit et donc a faible vitesse", () => {
    const early = planCycle(false, () => 0);
    const late = planCycle(false, () => 0.999);
    expect(late.swayTo).toBeCloseTo(SPIN_AFTER_LEGS_MAX / SWAY_LEGS);
    expect(late.swayTo).toBeGreaterThan(early.swayTo);
    expect(Math.abs(angleAt(PEAK_CURVE, late.swayTo))).toBeLessThan(Math.abs(angleAt(PEAK_CURVE, early.swayTo)));
  });

  it("fait un nombre de tours borne, dans un sens ou l'autre, et finit sur le sommet haut", () => {
    for (const [random, turns, direction] of [
      [0, SPIN_TURNS_MIN, 1],
      [0.999, SPIN_TURNS_MAX, -1],
    ] as const) {
      const values = [random, random, random];
      const plan = planCycle(false, () => values.shift() ?? random);
      const peak = angleAt(PEAK_CURVE, plan.swayTo);
      expect(plan.spinMs).toBe(turns * SPIN_TURN_MS + SPIN_EASE_MS);
      // Angle d'arrivee = angle de depart + tours, congru a l'ecart de depart modulo 360.
      const end = peak + plan.turnDeg;
      expect(Math.sign(plan.turnDeg)).toBe(direction);
      expect(Math.abs(Math.round((end - SWAY_START_DEG) / 360))).toBe(turns);
      expect(((end - SWAY_START_DEG) % 360) + 0).toBeCloseTo(0);
    }
  });
});
