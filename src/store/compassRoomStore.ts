import { createRoomStore } from '@/store';

import {
  type RoomGameState,
  type RoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from '../games/compass/firebase/room';

// Hors du barrel de `helpers/index.ts` : importe `firebase/firestore`, qui fait planter Jest.

const DEFAULT_GAME_STATE: RoomGameState = {
  screen: 'options',
  origin: null,
  places: [],
  roundIndex: 0,
  guesses: {},
  scores: null,
  totalScores: {},
};

/** Lu par `OnlineGameScreen` ; `SetupScreen` (via `useSetupRoom`) possede connexion/deconnexion. */
export const useRoomStore = createRoomStore<RoomSettings, RoomGameState>({
  defaultGameState: DEFAULT_GAME_STATE,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
  subscribeToRoomGame,
});
