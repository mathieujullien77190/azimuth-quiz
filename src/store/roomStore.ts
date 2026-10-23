import { create } from 'zustand';

import { subscribeToRoomGame, subscribeToRoomPlayers, subscribeToRoomSettings } from '@/games/firebase/room';
import type { RoomGameState } from '@/games/firebase/room';

import type { RoomStoreData, RoomStoreState } from './types';

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

const INITIAL_DATA: RoomStoreData = {
  code: null,
  players: {},
  hostUid: null,
  roomExists: true,
  roomSettings: null,
  gameState: DEFAULT_GAME_STATE,
  reaction: null,
  localUid: null,
  connectionLost: false,
};

/**
 * Store de la room en cours : cycle de connexion, joueurs, reglages et manche. `SetupScreen` (via `useSetupRoom`)
 * possede connexion/deconnexion, `OnlineGameScreen` lit. Les listeners Firestore de `connect`, le fait que la room
 * ait deja existe et le drapeau de depart volontaire sont des fermetures non reactives, pas de l'etat.
 */
export const useRoomStore = create<RoomStoreState>()((set, get) => {
  let unsubscribers: (() => void)[] = [];
  let hasSeenRoom = false;
  let leftVoluntarily = false;

  return {
    ...INITIAL_DATA,

    connect: (code) => {
      if (get().code === code) return;
      get().disconnect();

      hasSeenRoom = false;
      leftVoluntarily = false;
      set({ code, roomExists: true, connectionLost: false });

      unsubscribers = [
        subscribeToRoomPlayers(code, (players, hostUid, exists, _screen, reaction) => {
          if (exists) {
            hasSeenRoom = true;
          } else if (hasSeenRoom) {
            set({ roomExists: false });
            return;
          }
          set({ players, hostUid: hostUid ?? null, reaction: reaction ?? null });
        }),
        subscribeToRoomSettings(code, (roomSettings) => set({ roomSettings })),
        subscribeToRoomGame(code, (gameState) => set({ gameState })),
      ];
    },

    disconnect: () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      unsubscribers = [];
      set({ ...INITIAL_DATA });
    },

    markConnectionLost: () => set({ connectionLost: true }),

    markVoluntaryLeave: () => {
      leftVoluntarily = true;
    },

    consumeVoluntaryLeave: () => {
      const value = leftVoluntarily;
      leftVoluntarily = false;
      return value;
    },
  };
});
