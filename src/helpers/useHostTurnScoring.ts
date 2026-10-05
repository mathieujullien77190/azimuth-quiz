import { reporting } from './reportError';
import { useEffect, useRef } from 'react';

/** The slice of a turn-based room's game state the host's scoring needs (Clues). */
type TurnScoringState = {
  roundIndex: number;
  verdict: 'correct' | 'giveUp' | null;
  roundWinnerUid: string | null;
  wrongGuessUid: string | null;
  wrongGuessSeq: number;
  totalScores: Record<string, number>;
};

/**
 * Host-only scoring for a turn-based online game — the turn-holder only ever self-reports the
 * *event* (`verdict: 'correct'`, or a bumped `wrongGuessSeq`), never a score: this is the only thing
 * that ever writes `totalScores` (see `applyScore`).
 *
 * - A correct guess adds `reward` (what's still at stake this round) to the winner's total, once per
 *   round — guarded by a ref so a burst of snapshots can't fire it twice.
 * - A miss subtracts the fixed `penalty` from whoever missed, once per `wrongGuessSeq` advance
 *   rather than per round (a round can take several misses before it ends). The ref is `null` until
 *   this effect has run once: catches up to whatever seq the room is already at on mount (a host
 *   reconnecting mid-game) without re-applying a penalty that already landed before.
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
    // Initialized on the very first run whatever the state is — a fresh game starts with no miss
    // yet (`wrongGuessUid` null, seq 0), and the first real miss must then count as new, not as
    // something to "catch up" to.
    if (lastAppliedWrongSeqRef.current === null) {
      lastAppliedWrongSeqRef.current = wrongGuessSeq;
      return;
    }
    if (wrongGuessUid === null || wrongGuessSeq <= lastAppliedWrongSeqRef.current) return;
    lastAppliedWrongSeqRef.current = wrongGuessSeq;
    applyScore({ ...totalScores, [wrongGuessUid]: (totalScores[wrongGuessUid] ?? 0) - penalty }).catch(reporting('room.scoreWrong', { kind: 'background' }));
  }, [isHost, wrongGuessUid, wrongGuessSeq, totalScores, penalty, applyScore]);
};
