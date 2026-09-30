import { useSetupRoom, type SetupRoomAdapter } from '@/components/setup/useSetupRoom';
import { ROOM_PLAYER_COLORS } from '@/data';
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
  sendHeartbeat,
  startContourRoomGame,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/contour/helpers/room';
import { fetchContourRoundCodes } from '@/games/contour/helpers/firestoreContours';
import { newSimplifySeed } from '@/games/contour/helpers/simplify';
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
  sendHeartbeat,
  updateRoomPlayerColors,
};

/** Silhouette's side of the online setup: the room lifecycle is `useSetupRoom`'s (shared with the
 * other games), only what "Lancer la partie" writes is specific — every round's country, drawn
 * upfront, the seed of the silhouettes' simplification, and the first turn, handed to whoever's first in
 * arrival order. */
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
      // Drawn from Firestore, no fallback: a failure rejects, and the shared start flow shows a notice.
      const countryCodes = await fetchContourRoundCodes(settings);
      await startContourRoomGame(code, countryCodes, firstTurnUid, newSimplifySeed());
    });

  return { ...room, startOnlineContourGame };
};
