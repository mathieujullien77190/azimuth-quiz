import type { ReactionOverlayProps } from '@/components/ReactionOverlay';
import type { NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { ClueId, CluePlace, Coordinates, Difficulty } from '@/types';

export type OnlineClueGameScreenProps = {
  code: string;
  onQuit: () => void;
};

export type OnlineClueGameScreenViewProps = {
  onQuit: () => void;
  /** Reaction emoji a l'ecran, et ce qu'appelle un tap sur les emojis du footer (undefined seul dans la room). */
  reaction?: ReactionOverlayProps['reaction'];
  onReact?: (emoji: string) => void;
  /** Joueur de cet appareil et son total, pour l'en-tete. */
  name: string;
  points: number;
  roomCode: string;
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;

  place: CluePlace;
  bearingDeg: number;
  distanceKm: number;
  /** Le point de depart (indice globe). */
  origin?: Coordinates;
  revealedClueIds: ClueId[];
  skeletonGroups: NameSkeletonSlot[][];
  skeletonLengthKnown: boolean;

  /** Joueurs dans l'ordre de la manche (ordre d'arrivee decale par la manche, voir `playersForRound`). */
  players: OnlinePlayer[];
  /** Index dans `players` du detenteur du tour. */
  turnIndex: number;
  isMyTurn: boolean;
  /** Le detenteur du tour a deja propose : "Valider" est coupe, seul un indice reste (`turnGuess.ts`). */
  guessedThisTurn: boolean;
  /** Saisie du detenteur du tour en direct ; vide s'il n'y a rien a montrer (son propre tour, manche finie, rien tape). */
  typedByActivePlayer: string;

  remaining: number;
  /** Undefined hors `verdict !== null` (manche en cours). */
  verdict?: 'correct' | 'giveUp';
  winnerName?: string;
  /** Cet appareil a trouve le lieu (le bandeau dit "toi"). */
  iWon: boolean;

  wrongGuesserName: string | null;
  guessText: string;
  onChangeGuessText: (text: string) => void;
  onSubmitGuess: () => void;
  onGiveUp: () => void;
  onPickClue: (clueId: ClueId) => void;
  /** Pourquoi l'indice touche ne s'est pas ouvert ("c'est le tour de Zoe"), montre sur le plateau ; null sinon. */
  notice: string | null;
  onDismissNotice: () => void;

  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
