import { SWAY_LEGS, SWAY_START_DEG } from '../constants';
import { swayAngles } from '../helpers';

describe('swayAngles', () => {
  const angles = swayAngles();

  it('compte un cap par sens, le dernier etant le nord', () => {
    expect(angles).toHaveLength(SWAY_LEGS);
    expect(angles[angles.length - 1]).toBe(0);
  });

  it("part de l'ecart initial puis passe de l'autre cote du nord a chaque sens", () => {
    expect(angles[0]).toBe(SWAY_START_DEG);
    expect(angles[1]).toBeLessThan(0);
    expect(angles[2]).toBeGreaterThan(0);
  });

  it('se rapproche du nord a chaque aller-retour', () => {
    const swings = angles.slice(0, -1).map(Math.abs);
    swings.slice(1).forEach((swing, index) => expect(swing).toBeLessThan(swings[index]));
    expect(swings[swings.length - 1]).toBeLessThan(1);
  });
});
