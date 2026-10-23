import { createRoomStore } from '@/store';

import {
  type ClueRoomGameState,
  type ClueRoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from '../games/clues/firebase/room';

// Hors du barrel de `helpers/index.ts` : importe `firebase/firestore`, qui fait planter Jest.

const DEFAULT_GAME_STATE: ClueRoomGameState = {
  screen: 'options',
  origin: null,
  places: [],
  roundIndex: 0,
  revealedClueIds: [],
  turnUid: null,
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  wrongGuessHints: null,
  totalScores: {},
  typing: null,
};

/** Store de room d'Indices : meme cycle que Boussole (`createRoomStore`), seul `gameState` change. */
export const useClueRoomStore = createRoomStore<ClueRoomSettings, ClueRoomGameState>({
  defaultGameState: DEFAULT_GAME_STATE,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  subscribeToRoomGame,
});
