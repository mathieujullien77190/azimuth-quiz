import { createRoomStore } from '@/helpers/createRoomStore';

import {
  type ContourRoomGameState,
  type ContourRoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from '../helpers/room';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` itself: it imports
// `firebase/firestore` transitively, which crashes Jest the moment anything requires it.

const DEFAULT_GAME_STATE: ContourRoomGameState = {
  screen: 'options',
  countryCodes: [],
  simplifySeed: 0,
  roundIndex: 0,
  hintsRevealed: 0,
  hintPicks: [],
  quadrantsRevealed: [],
  turnUid: null,
  typing: null,
  verdict: null,
  roundWinnerUid: null,
  wrongGuessUid: null,
  wrongGuessSeq: 0,
  wrongGuessHints: null,
  totalScores: {},
};

/** Silhouette's own room store — same lifecycle as the other games' (see `createRoomStore`), only
 * the `gameState` shape differs. */
export const useContourRoomStore = createRoomStore<ContourRoomSettings, ContourRoomGameState>({
  defaultGameState: DEFAULT_GAME_STATE,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  subscribeToRoomGame,
});
