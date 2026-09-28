import { create } from 'zustand';

import {
  type ClueRoomGameState,
  type ClueRoomPlayers,
  type ClueRoomSettings,
  subscribeToRoomGame,
  subscribeToRoomPlayers,
  subscribeToRoomSettings,
} from '../helpers/room';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts` itself: it imports
// `firebase/firestore` transitively, which crashes Jest the moment anything requires it. Mirrors
// Compass's own `store/roomStore.ts` field for field — see that file for the full reasoning behind
// each piece, only the `RoomGameState` shape differs.

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

let unsubscribers: (() => void)[] = [];
let hasSeenRoom = false;
let leftVoluntarily = false;

type ClueRoomStoreState = {
  code: string | null;
  players: ClueRoomPlayers;
  hostUid: string | null;
  roomExists: boolean;
  roomSettings: ClueRoomSettings | null;
  gameState: ClueRoomGameState;
  localUid: string | null;
  connect: (code: string) => void;
  disconnect: () => void;
  markVoluntaryLeave: () => void;
  consumeVoluntaryLeave: () => boolean;
};

export const useClueRoomStore = create<ClueRoomStoreState>()((set, get) => ({
  code: null,
  players: {},
  hostUid: null,
  roomExists: true,
  roomSettings: null,
  gameState: DEFAULT_GAME_STATE,
  localUid: null,

  connect: (code) => {
    if (get().code === code) return;
    get().disconnect();

    hasSeenRoom = false;
    leftVoluntarily = false;
    set({ code, roomExists: true });

    unsubscribers = [
      subscribeToRoomPlayers(code, (players, hostUid, exists) => {
        if (exists) {
          hasSeenRoom = true;
        } else if (hasSeenRoom) {
          set({ roomExists: false });
          return;
        }
        set({ players, hostUid: hostUid ?? null });
      }),
      subscribeToRoomSettings(code, (roomSettings) => set({ roomSettings })),
      subscribeToRoomGame(code, (gameState) => set({ gameState })),
    ];
  },

  disconnect: () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
    set({
      code: null,
      players: {},
      hostUid: null,
      roomExists: true,
      roomSettings: null,
      gameState: DEFAULT_GAME_STATE,
      localUid: null,
    });
  },

  markVoluntaryLeave: () => {
    leftVoluntarily = true;
  },

  consumeVoluntaryLeave: () => {
    const value = leftVoluntarily;
    leftVoluntarily = false;
    return value;
  },
}));
