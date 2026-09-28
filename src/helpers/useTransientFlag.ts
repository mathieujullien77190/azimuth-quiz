import { useCallback, useEffect, useState } from 'react';

/** A flag that switches itself back off after `durationMs` (a notice that closes by itself): `show`
 * raises it, `hide` drops it early (a tap). */
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
