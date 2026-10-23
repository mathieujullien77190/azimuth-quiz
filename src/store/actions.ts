import type { RoomStoreActions, RoomStoreConfig, RoomStoreData, RoomStoreState } from './types';

/**
 * Actions du store de room. Les listeners Firestore de `connect`, le fait que la room ait deja existe et le drapeau
 * de depart volontaire sont des champs de fermeture non reactifs, pas de l'etat.
 */
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
