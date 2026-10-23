import { create } from 'zustand';

import { createRoomActions } from './actions';
import type { RoomStoreConfig, RoomStoreData, RoomStoreState } from './types';

/** One Zustand store per game's online room: the connection lifecycle, players/settings/game
 * state and the voluntary-leave flag are identical for every game, only the shape of `gameState`
 * (and the Firestore subscriptions feeding it) differs. The state lives here, the actions in
 * `actions.ts`. */
export const createRoomStore = <Settings, GameState>(config: RoomStoreConfig<Settings, GameState>) => {
  const initialData: RoomStoreData<Settings, GameState> = {
    code: null,
    players: {},
    hostUid: null,
    roomExists: true,
    roomSettings: null,
    gameState: config.defaultGameState,
    reaction: null,
    localUid: null,
    connectionLost: false,
  };

  return create<RoomStoreState<Settings, GameState>>()((set, get) => ({
    ...initialData,
    ...createRoomActions(config, initialData, set, get),
  }));
};
