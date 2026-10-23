import { reporting } from './reportError';
import { useEffect, useRef } from 'react';

/** Partie de l'etat de room dont le score de l'hote a besoin (Clues). */
type TurnScoringState = {
  roundIndex: number;
  verdict: 'correct' | 'giveUp' | null;
  roundWinnerUid: string | null;
  wrongGuessUid: string | null;
  wrongGuessSeq: number;
  totalScores: Record<string, number>;
};

/**
 * Score cote hote seul (seul a ecrire `totalScores`, voir `applyScore`) : le joueur n'annonce que l'evenement.
 * - Bonne reponse : ajoute `reward` une fois par manche (garde par ref contre les rafales de snapshots).
 * - Erreur : retire `penalty` une fois par avance de `wrongGuessSeq` (plusieurs erreurs possibles par manche) ;
 *   la ref est `null` jusqu'au 1er passage, qui se cale sur le seq de la room (hote reconnecte) sans repenaliser.
 */
export const useHostTurnScoring = (
  isHost: boolean,
  state: TurnScoringState,
  reward: number,
  penalty: number,
  applyScore: (totalScores: Record<string, number>) => Promise<void>,
) => {
  const { roundIndex, verdict, roundWinnerUid, wrongGuessUid, wrongGuessSeq, totalScores } = state;

  const scoredRoundRef = useRef(-1);
  useEffect(() => {
    if (!isHost || verdict !== 'correct' || roundWinnerUid === null) return;
    if (scoredRoundRef.current === roundIndex) return;
    scoredRoundRef.current = roundIndex;
    applyScore({ ...totalScores, [roundWinnerUid]: (totalScores[roundWinnerUid] ?? 0) + reward }).catch(reporting('room.scoreWin', { kind: 'background' }));
  }, [isHost, verdict, roundWinnerUid, roundIndex, totalScores, reward, applyScore]);

  const lastAppliedWrongSeqRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isHost) return;
    // Initialise au 1er passage quel que soit l'etat : une partie neuve a seq 0, la 1re erreur doit compter.
    if (lastAppliedWrongSeqRef.current === null) {
      lastAppliedWrongSeqRef.current = wrongGuessSeq;
      return;
    }
    if (wrongGuessUid === null || wrongGuessSeq <= lastAppliedWrongSeqRef.current) return;
    lastAppliedWrongSeqRef.current = wrongGuessSeq;
    applyScore({ ...totalScores, [wrongGuessUid]: (totalScores[wrongGuessUid] ?? 0) - penalty }).catch(reporting('room.scoreWrong', { kind: 'background' }));
  }, [isHost, wrongGuessUid, wrongGuessSeq, totalScores, penalty, applyScore]);
};
