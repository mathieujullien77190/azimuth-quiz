import type { HintStep } from '@/games/contour/helpers/hintPlan';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { ContourCountry, ContourRoundCountry, Difficulty } from '@/types';

export type OnlineContourGameScreenProps = {
  code: string;
  onQuit: () => void;
};

/** Pur rendu, un seul ecran plein cadre pour les 3 etats (tour actif, en attente, manche revelee) —
 * chaque valeur ici est deja resolue par `OnlineContourGameScreen`, chaque callback deja decide. */
export type OnlineContourGameScreenViewProps = {
  onQuit: () => void;
  /** This device's player and running total, for the header. */
  name: string;
  points: number;
  roomCode: string;
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;

  country: ContourRoundCountry;
  /** The countries around it (the backdrop and the border split, read with the round). */
  neighborCountries: readonly ContourCountry[];
  /** The round's hint steps (`buildHintPlan`, the last one reveals the country) and how many of them
   * are on the board. */
  plan: HintStep[];
  hintsRevealed: number;
  /** Seed of this round's random simplification of the outline, the same on every device. */
  simplifySeed: number;
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
  /** The country is revealed (last step) and nobody found it: closes the round for nobody. */
  onGiveUp: () => void;

  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
