import { useEffect, useState } from 'react';

import { TRAVEL_NOTICE_MS } from './constants';

/**
 * The "Vous êtes à Téhéran" splash opening a travel-mode round: shown once per round (`roundIndex`, not the place's
 * name — the same place can come back), gone by itself after `TRAVEL_NOTICE_MS` or on a tap, and not shown again
 * when that same round moves on to its reveal. `message` is undefined whenever there is nothing to say (first
 * round, no travel mode, the screen is not ready, the final standings), which also keeps the timer from running.
 */
export const useTravelNotice = (roundIndex: number, message: string | undefined) => {
  // The round whose splash is over: the splash is up while this is not the current round.
  const [doneRound, setDoneRound] = useState<number | null>(null);
  const visible = message !== undefined && doneRound !== roundIndex;

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setDoneRound(roundIndex), TRAVEL_NOTICE_MS);
    return () => clearTimeout(timeout);
  }, [visible, roundIndex]);

  return {
    travelNotice: visible ? message : null,
    dismissTravelNotice: () => setDoneRound(roundIndex),
  };
};
