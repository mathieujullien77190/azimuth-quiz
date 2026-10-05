import { useState } from 'react';

/**
 * This device's in-progress answer text and its "you got it wrong" banner, for the turn-based online
 * games (Clues) — both start over whenever the round or the turn-holder changes. Reset
 * while rendering (React's own pattern for "reset state when a value changes":
 * https://react.dev/reference/react/useState#storing-information-from-previous-renders) rather than
 * in an effect, which would mean an extra, avoidable render pass.
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
