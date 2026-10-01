import type { HintGroup, HintGroupView, HintStep } from '@/games/contour/helpers/hintPlan';
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
  /** The list under the country (`hintGroupsView`): what is out and what each group offers next. */
  hintGroups: HintGroupView[];
  hintsRevealed: number;
  /** Seed of this round's random simplification of the outline, the same on every device. */
  simplifySeed: number;
  /** What a correct guess earns right now (drops one tier per hint, 0 once the name is out). */
  pointsAtStake: number;

  players: OnlinePlayer[];
  turnIndex: number;
  isMyTurn: boolean;

  /** Set once the round is over: everything on the board is then shown, whatever the tier. */
  verdict?: 'correct' | 'giveUp';
  winnerName?: string;

  lastWrong: string | null;
  /** What the turn-holder is typing, live, for everybody else (empty for the turn-holder themself). */
  typedByActivePlayer: string;
  /** The "it's not your turn" notice (tapping a hint or the answer field out of turn), closing by itself or on a tap. */
  notice: string | null;
  onDismissNotice: () => void;
  /** A tap on the read-only answer field: says whose turn it is. */
  onNotYourTurn: () => void;
  guessText: string;
  onChangeGuessText: (text: string) => void;
  onSubmitGuess: () => void;
  /** The turn-holder tapped the next hint of a group. */
  onRevealHint: (group: HintGroup) => void;
  /** The country is revealed (last step) and nobody found it: closes the round for nobody. */
  onGiveUp: () => void;

  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
