import { useEffect, useState } from 'react';

/** `value` une fois stable depuis `delayMs` (la premiere valeur est rendue de suite), pour ne pas ecrire a chaque frappe. */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};
