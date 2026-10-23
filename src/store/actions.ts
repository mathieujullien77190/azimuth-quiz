import type { RoomStoreActions, RoomStoreConfig, RoomStoreData, RoomStoreState } from './types';

/** The room store's actions. The Firestore listeners `connect` currently owns, whether the room has
 * ever been seen to exist yet (to tell "the room was just deleted" apart from "hasn't loaded yet")
 * and the voluntary-leave flag are non-reactive closure fields rather than store state. */
export const createRoomActions = <Settings, GameState>(
  { defaultGameState, subscribeToRoomPlayers, subscribeToRoomSettings, subscribeToRoomGame }: RoomStoreConfig<
    Settings,
    GameState
  >,
  initialData: RoomStoreData<Settings, GameState>,
  set: (partial: Partial<RoomStoreState<Settings, GameState>>) => void,
  get: () => RoomStoreState<Settings, GameState>,
): RoomStoreActions => {
  let unsubscribers: (() => void)[] = [];
  let hasSeenRoom = false;
  let leftVoluntarily = false;

  return {
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
      set({ ...initialData, gameState: defaultGameState });
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
};
