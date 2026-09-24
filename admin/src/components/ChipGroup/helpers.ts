/** Toggles `key` in `set` (never empty — a `ChipGroup` must always filter on at least one
 * value, otherwise the list would silently empty out). */
export const toggleInSet = <T,>(set: Set<T>, key: T): Set<T> => {
  if (set.has(key)) {
    if (set.size === 1) return set;
    const next = new Set(set);
    next.delete(key);
    return next;
  }
  return new Set(set).add(key);
};
