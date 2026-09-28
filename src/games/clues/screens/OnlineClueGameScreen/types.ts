import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import type { ClueId, CluePlace, Difficulty } from '@/types';

export type OnlineClueGameScreenProps = {
  code: string;
  onQuit: () => void;
};

/** One connected player, in the stable arrival-order used everywhere in this screen (scores,
 * turn order) — built once from the room's `players` map (see `onlineClueRoomPlayersFrom`). */
export type OnlineCluePlayer = {
  uid: string;
  name: string;
  color: string;
};

export type OnlineClueGameScreenViewProps = {
  onQuit: () => void;
  headerScore: string;
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;

  place: CluePlace;
  bearingDeg: number;
  distanceKm: number;
  revealedClueIds: ClueId[];
  skeletonGroups: NameSkeletonSlot[][];
  skeletonLengthKnown: boolean;

  players: OnlineCluePlayer[];
  turnIndex: number;
  isMyTurn: boolean;
  turnPlayerName: string;

  remaining: number;
  /** Undefined outside `verdict !== null` (round in progress). */
  verdict?: 'correct' | 'giveUp';
  winnerName?: string;

  lastWrong: string | null;
  guessText: string;
  onChangeGuessText: (text: string) => void;
  onSubmitGuess: () => void;
  onGiveUp: () => void;
  onPickClue: (clueId: ClueId) => void;

  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
