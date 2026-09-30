import { countryContourFields, contoursToMerge } from './countryContours';
import { decodeRing, encodeRing } from './polyline';
import type { ContourCountryDoc, CountryDoc } from './types';

const contour = (overrides: Partial<ContourCountryDoc> = {}): ContourCountryDoc => ({
  fr: 'x',
  en: 'x',
  points: [],
  difficulty: 'intermediate',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [],
  borderCodes: [],
  ...overrides,
});

const FRANCE = contour({
  points: [2.5, 42.5, 8.2, 42.5, 8.2, 51.1, 2.5, 42.5],
  neighbors: [
    { type: 'country', code: 'ES', x: 0.1, y: 0.9, fr: 'Espagne', en: 'Spain' },
    { type: 'country', code: 'GB', x: 0.5, y: 0.1, fr: 'Royaume-Uni', en: 'United Kingdom' },
  ],
  borderCodes: ['IT', 'ES', 'BE', 'XX'],
  capital: { name: 'Paris', lon: 2.35, lat: 48.85 },
  cities: [{ name: 'Lyon', lon: 4.83, lat: 45.76 }],
  n: 2,
});
const SPAIN = contour({ points: [-9.3, 36, 3.3, 42.5, 2.5, 42.5, -9.3, 36], borderCodes: ['FR'] });
const ITALY = contour({
  points: [7, 44, 12, 46, 7, 44],
  ring: encodeRing([
    [7, 44],
    [12, 46],
    [7, 44],
  ]),
  borderCodes: ['FR'],
});
const contours = { FR: FRANCE, ES: SPAIN, IT: ITALY };
const countries: Record<string, CountryDoc> = {
  FR: { fr: 'France', en: 'France' },
  ES: { fr: 'Espagne', en: 'Spain' },
  IT: { fr: 'Italie', en: 'Italy' },
  BE: { fr: 'Belgique', en: 'Belgium' },
};

describe('countryContourFields', () => {
  const fields = countryContourFields(FRANCE, contours, countries);

  it('keeps the silhouette of the country: outline, difficulty, label anchor, capital, cities and position', () => {
    expect(decodeRing(fields.ring)).toEqual([
      [2.5, 42.5],
      [8.2, 42.5],
      [8.2, 51.1],
      [2.5, 42.5],
    ]);
    expect(fields).toMatchObject({
      difficulty: 'intermediate',
      centerLabel: { x: 0.5, y: 0.5 },
      capital: FRANCE.capital,
      cities: FRANCE.cities,
      n: 2,
    });
  });

  it('merges the hinted neighbours and the bordering ones into one list, hinted first', () => {
    expect(fields.neighbors.map((neighbor) => neighbor.code)).toEqual(['ES', 'GB', 'BE', 'IT', 'XX']);
  });

  it('gives a hinted neighbour its position and its names, and the outline only if it borders the country', () => {
    const [spain, britain] = fields.neighbors;

    expect(spain).toMatchObject({ code: 'ES', fr: 'Espagne', en: 'Spain', x: 0.1, y: 0.9 });
    expect(decodeRing(spain.ring!)).toEqual(
      decodeRing(
        encodeRing([
          [-9.3, 36],
          [3.3, 42.5],
          [2.5, 42.5],
          [-9.3, 36],
        ]),
      ),
    );
    // Great Britain is a hint but shares no land border: no outline to draw as a backdrop.
    expect(britain).toEqual({ code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', x: 0.5, y: 0.1 });
  });

  it('gives a bordering neighbour its outline and the names of its country, no position', () => {
    const [belgium, italy, unknown] = fields.neighbors.slice(2);

    // Belgium borders France but has no silhouette of its own: names only.
    expect(belgium).toEqual({ code: 'BE', fr: 'Belgique', en: 'Belgium' });
    expect(italy).toMatchObject({ code: 'IT', fr: 'Italie', en: 'Italy', ring: ITALY.ring });
    expect(italy).not.toHaveProperty('x');
    // A code known nowhere is its own name.
    expect(unknown).toEqual({ code: 'XX', fr: 'XX', en: 'XX' });
  });

  it('leaves the optional fields out when the old document has none', () => {
    const bare = countryContourFields(SPAIN, contours, countries);

    expect(bare).not.toHaveProperty('capital');
    expect(bare).not.toHaveProperty('cities');
    expect(bare).not.toHaveProperty('n');
    expect(bare.neighbors).toEqual([{ code: 'FR', fr: 'France', en: 'France', ring: fields.ring }]);
  });

  it('uses the encoded ring of a document that already has one', () => {
    expect(countryContourFields(ITALY, contours, countries).ring).toBe(ITALY.ring);
  });
});

describe('contoursToMerge', () => {
  it('lists the silhouettes whose country has no outline yet, ignoring those without a country', () => {
    const merged = { ...countries, FR: { ...countries.FR, ring: 'abc' } };

    expect(contoursToMerge(contours, countries).sort()).toEqual(['ES', 'FR', 'IT']);
    expect(contoursToMerge(contours, merged).sort()).toEqual(['ES', 'IT']);
    expect(contoursToMerge({ ZZ: contour() }, countries)).toEqual([]);
  });
});
