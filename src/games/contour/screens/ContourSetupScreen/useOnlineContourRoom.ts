import { useSetupRoom, type SetupRoomAdapter } from '@/components/setup/useSetupRoom';
import { CONTOURS, ROOM_PLAYER_COLORS } from '@/data';
import {
  ROOM_MAX_PLAYERS,
  type ContourRoomSettings,
  contourRoomSettingsFrom,
  createRoom,
  deleteRoom,
  isValidRoomCode,
  joinRoomPresence,
  removeRoomPlayer,
  roomExists,
  startContourRoomGame,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/contour/helpers/room';
import { pickContourRoundCodes } from '@/games/contour/helpers/contourCountry';
import { useContourRoomStore } from '@/games/contour/store/roomStore';
import { playersByArrival } from '@/helpers/roomPlayers';
import type { ContourSettings } from '@/types';

const adapter: SetupRoomAdapter<ContourSettings, ContourRoomSettings> = {
  store: useContourRoomStore,
  gamePath: '/contour-online-game',
  colors: ROOM_PLAYER_COLORS,
  maxPlayers: ROOM_MAX_PLAYERS,
  roomSettingsFrom: contourRoomSettingsFrom,
  isValidRoomCode,
  createRoom,
  roomExists,
  updateRoomSettings,
  joinRoomPresence,
  removeRoomPlayer,
  deleteRoom,
  updateRoomPlayerColors,
};

/** Silhouette's side of the online setup: the room lifecycle is `useSetupRoom`'s (shared with the
 * other games), only what "Lancer la partie" writes is specific — every round's country, drawn
 * upfront, and the first turn, handed to whoever's first in arrival order. */
export const useOnlineContourRoom = (
  settings: ContourSettings,
  updateSettings: (patch: Partial<ContourSettings>) => void,
) => {
  const room = useSetupRoom(adapter, settings, updateSettings);

  const startOnlineContourGame = () =>
    room.startOnlineGame(async (code) => {
      // Read here, not before: in solo the room only exists (and lists this device) by the time this runs.
      const firstTurnUid = playersByArrival(useContourRoomStore.getState().players)[0]?.[0];
      if (firstTurnUid === undefined) throw new Error('no player in the room');
      await startContourRoomGame(code, pickContourRoundCodes(CONTOURS, settings.difficulty, settings.rounds), firstTurnUid);
    });

  return { ...room, startOnlineContourGame };
};
