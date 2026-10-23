import { useState } from 'react';

/**
 * Brouillon de reponse et banniere "rate" de cet appareil (jeux au tour par tour), remis a zero quand la manche
 * ou le detenteur du tour change. Reinitialise au rendu (https://react.dev/reference/react/useState#storing-information-from-previous-renders), sans effet.
 */
export const useGuessDraft = (roundIndex: number, turnUid: string | null) => {
  const [guessText, setGuessText] = useState('');
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const currentKey = `${roundIndex}:${turnUid ?? ''}`;
  const [draftKey, setDraftKey] = useState(currentKey);
  if (currentKey !== draftKey) {
    setDraftKey(currentKey);
    setGuessText('');
    setLastWrong(null);
  }
  return { guessText, setGuessText, lastWrong, setLastWrong };
};
