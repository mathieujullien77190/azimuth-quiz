import { contourRingFields, contoursNeedingRings } from './contourRings';
import { decodeRing } from './polyline';
import type { ContourCountryDoc } from './types';

const doc = (points: number[], borderCodes: string[] = []): ContourCountryDoc => ({
  fr: 'x',
  en: 'x',
  points,
  difficulty: 'intermediate',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [],
  borderCodes,
});

const FRANCE = doc([2.5, 42.5, 8.2, 42.5, 8.2, 51.1, 2.5, 42.5], ['ES', 'XX']);
const SPAIN = doc([-9.3, 36, 3.3, 42.5, 2.5, 42.5, -9.3, 36], ['FR']);
const docs = { FR: FRANCE, ES: SPAIN };

describe('contourRingFields', () => {
  it('encodes the own outline and copies the ring of every neighbour that has a document', () => {
    const { ring, neighborRings } = contourRingFields(FRANCE, docs);

    expect(decodeRing(ring)).toEqual([
      [2.5, 42.5],
      [8.2, 42.5],
      [8.2, 51.1],
      [2.5, 42.5],
    ]);
    // XX has no document: not copied.
    expect(Object.keys(neighborRings)).toEqual(['ES']);
    expect(decodeRing(neighborRings.ES)).toEqual([
      [-9.3, 36],
      [3.3, 42.5],
      [2.5, 42.5],
      [-9.3, 36],
    ]);
  });

  it('reads a document that only has its encoded ring left', () => {
    const migrated = { ...FRANCE, ...contourRingFields(FRANCE, docs), points: [] };
    expect(contourRingFields(migrated, docs).ring).toBe(contourRingFields(FRANCE, docs).ring);
    expect(contourRingFields({ ...FRANCE, points: [], ring: undefined }, docs).ring).toBe('');
  });
});

describe('contoursNeedingRings', () => {
  it('lists every country that has none yet', () => {
    expect(contoursNeedingRings(docs).sort()).toEqual(['ES', 'FR']);
  });

  it('is empty once the fields are there, and lists a country whose neighbours changed since', () => {
    const migrated = {
      FR: { ...FRANCE, ...contourRingFields(FRANCE, docs) },
      ES: { ...SPAIN, ...contourRingFields(SPAIN, docs) },
    };
    expect(contoursNeedingRings(migrated)).toEqual([]);

    const moved = { ...migrated, FR: { ...migrated.FR, points: [2.5, 42.5, 9, 43, 8.2, 51.1, 2.5, 42.5] } };
    expect(contoursNeedingRings(moved).sort()).toEqual(['ES', 'FR']);
  });
});
