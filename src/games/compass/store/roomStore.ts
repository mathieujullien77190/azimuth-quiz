import { createRoomStore } from '@/helpers/createRoomStore';

import {
  type RoomGameState,
  type RoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from '../helpers/room';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` itself: it imports
// `firebase/firestore` transitively, which crashes Jest the moment anything requires it.

const DEFAULT_GAME_STATE: RoomGameState = {
  screen: 'options',
  origin: null,
  places: [],
  roundIndex: 0,
  guesses: {},
  scores: null,
  totalScores: {},
};

/** Shared with `OnlineGameScreen`, which only ever reads it — `SetupScreen` (through
 * `useSetupRoom`) owns the connect/disconnect lifecycle. See `createRoomStore` for the fields. */
export const useRoomStore = createRoomStore<RoomSettings, RoomGameState>({
  defaultGameState: DEFAULT_GAME_STATE,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  subscribeToRoomGame,
});
