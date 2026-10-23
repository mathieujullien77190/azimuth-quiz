import { useEffect, useState } from 'react';

import { TRAVEL_NOTICE_MS } from './constants';

/**
 * Splash "Vous etes a ..." d'ouverture de manche en mode voyage : une fois par manche (`roundIndex`, pas le
 * nom : le lieu peut revenir), disparait apres `TRAVEL_NOTICE_MS` ou au tap, pas re-affiche au reveal.
 * `message` est undefined quand il n'y a rien a dire (le timer ne tourne alors pas).
 */
export const useTravelNotice = (roundIndex: number, message: string | undefined) => {
  // Manche dont le splash est fini : il est affiche tant que ce n'est pas la manche courante.
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
