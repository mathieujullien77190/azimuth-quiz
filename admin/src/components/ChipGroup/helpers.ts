/** Bascule `key` dans `set` (jamais vide — un `ChipGroup` doit toujours filtrer sur au moins une
 * valeur, sinon la liste se viderait silencieusement). */
export const toggleInSet = <T,>(set: Set<T>, key: T): Set<T> => {
  if (set.has(key)) {
    if (set.size === 1) return set;
    const next = new Set(set);
    next.delete(key);
    return next;
  }
  return new Set(set).add(key);
};
