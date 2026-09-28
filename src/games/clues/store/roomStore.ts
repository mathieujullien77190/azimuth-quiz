import { createRoomStore } from '@/helpers/createRoomStore';

import {
  type ClueRoomGameState,
  type ClueRoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from '../helpers/room';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` itself: it imports
// `firebase/firestore` transitively, which crashes Jest the moment anything requires it.

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
  totalScores: {},
};

/** Clues' own room store — same lifecycle as Compass' (see `createRoomStore`), only the
 * `gameState` shape differs. */
export const useClueRoomStore = createRoomStore<ClueRoomSettings, ClueRoomGameState>({
  defaultGameState: DEFAULT_GAME_STATE,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  subscribeToRoomGame,
});
