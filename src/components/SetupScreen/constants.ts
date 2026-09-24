/** Choice of distance slider type: two modes of the same `straightLine` setting. Label/description
 * come from translations.setup.distanceModes (same id). */
export const DISTANCE_MODES = [
  { id: 'distance', straightLine: false },
  { id: 'inclination', straightLine: true },
] as const;
