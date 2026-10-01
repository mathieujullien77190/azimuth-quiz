import { reporting } from '@/helpers/reportError';
import { useEffect, useState } from 'react';

import { loadRoundData, type RoundData } from './firestoreContours';

/**
 * The data of the round being played (`loadRoundData`: the country's document and its neighbors'), loaded from
 * Firestore, and the next round's right after, so changing round shows no wait. `data` is `undefined` while the
 * round loads; `failed` is set when it could not be read, and `retry` tries again.
 */
export const useRoundData = (countryCodes: readonly string[], roundIndex: number) => {
  const code = countryCodes[roundIndex];
  const nextCode = countryCodes[roundIndex + 1];
  const [loaded, setLoaded] = useState<{ code: string; data: RoundData } | null>(null);
  // Which attempt at which round failed: a new round or a retry is a new attempt, so it is not "failed" any more.
  const [failure, setFailure] = useState<{ code: string; attempt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (code === undefined) return;
    let cancelled = false;
    loadRoundData(code)
      .then((data) => {
        if (!cancelled) setLoaded({ code, data });
      })
      .catch(() => {
        if (!cancelled) setFailure({ code, attempt });
      });
    // The next round is read in the background: an error here will show when it becomes the current one.
    if (nextCode !== undefined) loadRoundData(nextCode).catch(reporting('silhouette.prefetchRound', { kind: 'background' }));
    return () => {
      cancelled = true;
    };
  }, [code, nextCode, attempt]);

  return {
    data: loaded !== null && loaded.code === code ? loaded.data : undefined,
    failed: failure !== null && failure.code === code && failure.attempt === attempt,
    retry: () => setAttempt((count) => count + 1),
  };
};
