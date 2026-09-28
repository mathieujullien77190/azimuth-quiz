import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { ClueId, CluePlace, Difficulty } from '@/types';

export type OnlineClueGameScreenProps = {
  code: string;
  onQuit: () => void;
};

export type OnlineClueGameScreenViewProps = {
  onQuit: () => void;
  /** This device's player and running total, for the header. */
  name: string;
  points: number;
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

  remaining: number;
  /** Undefined outside `verdict !== null` (round in progress). */
  verdict?: 'correct' | 'giveUp';
  winnerName?: string;
  /** This device is the one who found the place (the banner then says "you"). */
  iWon: boolean;

  lastWrong: string | null;
  guessText: string;
  onChangeGuessText: (text: string) => void;
  onSubmitGuess: () => void;
  onGiveUp: () => void;
  onPickClue: (clueId: ClueId) => void;
  /** Why the tapped clue didn't open ("it's Zoé's turn"), shown over the board; null when nothing to say. */
  notice: string | null;
  onDismissNotice: () => void;

  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
