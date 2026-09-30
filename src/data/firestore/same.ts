/** `value` as JSON with every object's keys sorted: Firestore hands maps back in alphabetical order, while
 * the code that builds a copy lists its fields in its own order — comparing the two must not care. */
const stable = (value: unknown): string =>
  JSON.stringify(value, (_key, each: unknown) =>
    each && typeof each === 'object' && !Array.isArray(each)
      ? Object.fromEntries(Object.entries(each).sort(([a], [b]) => (a < b ? -1 : 1)))
      : each,
  );

/** Deep equality of two plain JSON values, whatever the order of their object keys. */
export const sameJson = (a: unknown, b: unknown): boolean => stable(a) === stable(b);
