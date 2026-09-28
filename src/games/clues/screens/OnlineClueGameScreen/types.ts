import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { ClueId, CluePlace, Difficulty } from '@/types';

export type OnlineClueGameScreenProps = {
  code: string;
  onQuit: () => void;
};

export type OnlineClueGameScreenViewProps = {
  onQuit: () => void;
  headerScore: string;
  roomCode: string;
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;

  place: CluePlace;
  bearingDeg: number;
  distanceKm: number;
  revealedClueIds: ClueId[];
  skeletonGroups: NameSkeletonSlot[][];
  skeletonLengthKnown: boolean;

  players: OnlinePlayer[];
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
