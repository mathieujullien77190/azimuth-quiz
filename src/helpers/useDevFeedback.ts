import { useState } from 'react';

import { useTranslation } from '@/i18n';
import { useDevMode } from '@/settings';
import type { Difficulty } from '@/types';

import { sendDevFeedback, type DevFeedback } from '../firebase/devFeedback';
import { reporting } from './reportError';

/** Sujet de la question : le lieu ou le pays, tel que le jeu le connait. */
export type DevFeedbackTarget = Pick<DevFeedback, 'targetType' | 'targetKey' | 'name'> & {
  /** Difficulte actuelle en base. */
  difficulty: Difficulty;
};

type Options = {
  game: DevFeedback['game'];
  /** Manche en cours. */
  roundIndex: number;
  /** Reponse connue (reveal, verdict) : la manche est retenue, rien n'est encore demande. */
  roundOver: boolean;
  /** Partie finie : on interroge sur la derniere manche, quel que soit l'etat de la manche. */
  gameOver: boolean;
  /** Undefined tant que les donnees de la manche chargent. */
  target: DevFeedbackTarget | undefined;
};

type EndedRound = { roundIndex: number; target: DevFeedbackTarget };

/**
 * Question de difficulte du mode dev : portee sur le lieu de la manche PRECEDENTE, une fois l'hote passe a la suivante
 * (ou au classement final), une fois par manche (si deux passent sans reponse, seule la derniere). Chaque appareil
 * decide seul, rien dans la room. Un echec d'ecriture est seulement logge. Compteur de manche qui recule = nouvelle partie.
 */
export const useDevFeedback = ({ game, roundIndex, roundOver, gameOver, target }: Options) => {
  const t = useTranslation();
  const devMode = useDevMode();
  const [ended, setEnded] = useState<EndedRound | null>(null);
  const [handledRound, setHandledRound] = useState<number | null>(null);

  // Retenu pendant que la manche est finie (pose au rendu) : seul moment ou son lieu est a l'ecran.
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
