/** JSON a cles triees : Firestore rend les maps par ordre alphabetique, pas dans l'ordre du code qui construit la copie. */
const stable = (value: unknown): string =>
  JSON.stringify(value, (_key, each: unknown) =>
    each && typeof each === 'object' && !Array.isArray(each)
      ? Object.fromEntries(Object.entries(each).sort(([a], [b]) => (a < b ? -1 : 1)))
      : each,
  );

/** Egalite profonde de deux JSON, quel que soit l'ordre des cles. */
export const sameJson = (a: unknown, b: unknown): boolean => stable(a) === stable(b);
