import { useState } from 'react';

import { useTranslation } from '@/i18n';
import { useDevMode } from '@/settings';
import type { Difficulty } from '@/types';

import { sendDevFeedback, type DevFeedback } from './devFeedback';
import { reporting } from './reportError';

/** What a round is about, for the question: the place or the country, as the game knows it. */
export type DevFeedbackTarget = Pick<DevFeedback, 'targetType' | 'targetKey' | 'name'> & {
  /** The difficulty the data has now. */
  difficulty: Difficulty;
};

type Options = {
  game: DevFeedback['game'];
  /** Which round is on. */
  roundIndex: number;
  /** The round's answer is known (the reveal, the verdict): the round is remembered from then on, but nothing is asked yet. */
  roundOver: boolean;
  /** The game is over (the final standings): the last round is asked about there, whatever the round state still says. */
  gameOver: boolean;
  /** Undefined while the round's data is still loading. */
  target: DevFeedbackTarget | undefined;
};

type EndedRound = { roundIndex: number; target: DevFeedbackTarget };

/**
 * The dev mode's difficulty question, for every game: a device that has the dev code is asked whether the place/country of
 * the round that just ended was easy, intermediate or hard — but only once the game has moved past that round (the host
 * pressed "next round", or the final standings are up), never over the reveal/verdict itself. The question is about the
 * PREVIOUS round's target, remembered while that round was over, and asked at most once per round; if two rounds go by
 * before the player answers, only the latest ended one is asked. `question` (already translated, or null) feeds
 * `DifficultyFeedbackOverlay`; `choose` writes the opinion (a failure is only logged, never shown) and `dismiss` drops the
 * question without writing. Each device decides alone: nothing here touches the room, so it never delays scoring or the
 * next round. A new game on the same room (the round counter going back) forgets the remembered round.
 */
export const useDevFeedback = ({ game, roundIndex, roundOver, gameOver, target }: Options) => {
  const t = useTranslation();
  const devMode = useDevMode();
  const [ended, setEnded] = useState<EndedRound | null>(null);
  const [handledRound, setHandledRound] = useState<number | null>(null);

  // Remembered while the round is over (set during render, React's pattern for state derived from props): the round
  // being over is the only moment its place/country is on screen. A round counter that went back is a new game.
  if (roundOver && target !== undefined && ended?.roundIndex !== roundIndex) {
    setEnded({ roundIndex, target });
  } else if (ended !== null && roundIndex < ended.roundIndex) {
    setEnded(null);
    setHandledRound(null);
  }

  const asking =
    devMode &&
    ended !== null &&
    handledRound !== ended.roundIndex &&
    ended.roundIndex !== roundIndex &&
    (gameOver || !roundOver);

  const choose = (suggestedDifficulty: Difficulty) => {
    if (ended === null) return;
    sendDevFeedback({
      game,
      targetType: ended.target.targetType,
      targetKey: ended.target.targetKey,
      name: ended.target.name,
      currentDifficulty: ended.target.difficulty,
      suggestedDifficulty,
    }).catch(reporting('devFeedback.send', { kind: 'background' }));
    setHandledRound(ended.roundIndex);
  };
  const dismiss = () => {
    if (ended !== null) setHandledRound(ended.roundIndex);
  };

  const question = !asking ? null : t.devFeedback.placeQuestion(ended.target.name);

  return { question, choose, dismiss };
};
