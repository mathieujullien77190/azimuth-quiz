import { useEffect, useState } from 'react';

/** `value`, but only once it has stopped changing for `delayMs` — the first value is returned at once.
 * For a text field whose every keystroke would otherwise trigger a network write. */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};
