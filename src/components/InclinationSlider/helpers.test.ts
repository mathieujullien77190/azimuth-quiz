import { DISTANCE_MARKS_KM } from '@/constants';
import { formatInclination, inclinationFromChordKm, kmToRatio } from '@/helpers';

import { distanceMarks } from './helpers';

describe('distanceMarks', () => {
  it('places a mark for every DISTANCE_MARKS_KM value below maxKm, positioned by km but labelled in degrees', () => {
    const maxKm = 12000;
    const marks = distanceMarks(maxKm);
    const expectedKm = DISTANCE_MARKS_KM.filter((km) => km < maxKm);
    expect(marks).toHaveLength(expectedKm.length);
    marks.forEach((mark, index) => {
      const km = expectedKm[index];
      expect(mark.ratio).toBe(kmToRatio(km, maxKm));
      expect(mark.label).toBe(formatInclination(inclinationFromChordKm(km)));
    });
  });

  it('excludes marks at or above maxKm', () => {
    const marks = distanceMarks(1000);
    expect(marks.map((mark) => mark.label)).toEqual([formatInclination(inclinationFromChordKm(100))]);
  });
});
