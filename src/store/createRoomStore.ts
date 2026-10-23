import { create } from 'zustand';

import { createRoomActions } from './actions';
import type { RoomStoreConfig, RoomStoreData, RoomStoreState } from './types';

/**
 * Un store Zustand par room de jeu : cycle de connexion, joueurs, reglages et drapeau de depart identiques pour
 * tous, seule la forme de `gameState` varie. Etat ici, actions dans `actions.ts`.
 */
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
