import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { ContourCountry, Difficulty } from '@/types';

export type OnlineContourGameScreenProps = {
  code: string;
  onQuit: () => void;
};

/** Pur rendu, un seul ecran plein cadre pour les 3 etats (tour actif, en attente, manche revelee) —
 * chaque valeur ici est deja resolue par `OnlineContourGameScreen`, chaque callback deja decide. */
export type OnlineContourGameScreenViewProps = {
  onQuit: () => void;
  headerScore: string;
  roomCode: string;
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;

  country: ContourCountry;
  /** How many of the 4 hint tiers are on the board (0-4). */
  hintsRevealed: number;
  /** What a correct guess earns right now (drops one tier per hint, 0 once the name is out). */
  pointsAtStake: number;

  players: OnlinePlayer[];
  turnIndex: number;
  isMyTurn: boolean;
  turnPlayerName: string;

  /** Set once the round is over: everything on the board is then shown, whatever the tier. */
  verdict?: 'correct' | 'giveUp';
  winnerName?: string;

  lastWrong: string | null;
  guessText: string;
  onChangeGuessText: (text: string) => void;
  onSubmitGuess: () => void;
  onRevealHint: () => void;
  /** The name is out (tier 4) and nobody found it: closes the round for nobody. */
  onGiveUp: () => void;

  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
