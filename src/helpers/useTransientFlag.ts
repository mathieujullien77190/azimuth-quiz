import { useCallback, useEffect, useState } from 'react';

/** Drapeau qui retombe seul apres `durationMs` : `show` le leve, `hide` le baisse avant (un tap). */
export const useTransientFlag = (durationMs = 2000) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timeout);
  }, [visible, durationMs]);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  return { visible, show, hide };
};
