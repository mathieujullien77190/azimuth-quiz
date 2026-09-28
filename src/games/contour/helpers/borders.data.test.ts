import { CONTOURS } from '@/data';

import { computeBorders } from './borders';

const byCode = (code: string) => CONTOURS.find((country) => country.code === code)!;

/** Codes of the dataset countries whose ring `computeBorders` reports as touching `code`. */
const touching = (code: string): string[] => {
  const { neighborRings } = computeBorders(byCode(code), CONTOURS);
  return CONTOURS.filter((country) => neighborRings.includes(country.points)).map((country) => country.code);
};

// Ten curated pairs still do not touch (AO-CG, AZ-TR, BG-TR, BW-ZM, DJ-SO, GR-TR, ID-TL, ID-PG, LS-ZA,
// MY-TH): their border lies in a polygon other than the country's main ring (exclave, island, hole).
// The whole dataset comes from one single simplified topology (scripts/generateContours.mjs): a
// land border must be made of the same vertices on both sides, including for the 8 countries that
// used to be drawn by hand with another definition.
describe('borders of the real dataset', () => {
  it.each([
    ['FR', ['BE', 'DE', 'CH', 'IT', 'ES']],
    ['DE', ['DK', 'PL', 'CZ', 'AT', 'CH', 'FR', 'BE', 'NL']],
    ['ES', ['PT', 'FR']],
    ['PT', ['ES']],
    ['IT', ['FR', 'CH', 'AT', 'SI']],
    ['GR', ['AL', 'MK', 'BG']],
  ])('%s touches its land neighbors', (code, expected) => {
    // Neighbors the dataset has no outline for (DK, ...) simply cannot be drawn: only require the
    // ones it has.
    const known = expected.filter((neighbor) => CONTOURS.some((country) => country.code === neighbor));
    expect(touching(code)).toEqual(expect.arrayContaining(known));
  });

  it('is symmetric: if A touches B, B touches A', () => {
    for (const code of ['FR', 'ES', 'DE', 'IT', 'NO']) {
      for (const other of touching(code)) expect(touching(other)).toContain(code);
    }
  });

  it('has an island country with nothing around it', () => {
    expect(touching('IE')).toEqual([]);
  });
});
