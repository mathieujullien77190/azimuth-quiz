import { useSetupRoom, type SetupRoomAdapter } from '@/components/setup/useSetupRoom';
import { ROOM_PLAYER_COLORS } from '@/data';
import { resolveOrigin } from '@/helpers';
import { fetchRandomPlaces } from '@/games/compass/helpers/firestorePlaces';
import {
  ROOM_MAX_PLAYERS,
  type RoomSettings,
  createRoom,
  deleteRoom,
  isValidRoomCode,
  joinRoomPresence,
  removeRoomPlayer,
  roomExists,
  roomSettingsFrom,
  sendHeartbeat,
  startRoomGame,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/compass/helpers/room';
import { useRoomStore } from '@/games/compass/store/roomStore';
import { useLanguage, useTranslation } from '@/i18n';
import type { GameSettings } from '@/types';

const adapter: SetupRoomAdapter<GameSettings, RoomSettings> = {
  store: useRoomStore,
  gamePath: '/online-game',
  colors: ROOM_PLAYER_COLORS,
  maxPlayers: ROOM_MAX_PLAYERS,
  roomSettingsFrom,
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

/** Compass' side of the online setup: the room lifecycle is `useSetupRoom`'s (shared with Clues),
 * only what "Lancer la partie" writes is specific — the host's own GPS/custom position, never a
 * joiner's, is the shared reference every guess gets scored against (see `startRoomGame`), and the
 * whole game's places are drawn upfront by the host from Firestore (`fetchRandomPlaces`, no fallback:
 * a failure rejects and `useSetupRoom` shows the "couldn't start" notice). */
export const useOnlineRoom = (settings: GameSettings, updateSettings: (patch: Partial<GameSettings>) => void) => {
  const t = useTranslation();
  const { language } = useLanguage();
  const room = useSetupRoom(adapter, settings, updateSettings);

  const startOnlineGame = () =>
    room.startOnlineGame(async (code) => {
      const origin = settings.useGps
        ? await resolveOrigin(t.common.yourPosition)
        : {
            name: t.common.yourPosition,
            coordinates: { latitude: settings.customLatitude, longitude: settings.customLongitude },
            isDevicePosition: false,
          };
      // Drawn from Firestore, no fallback: a failure rejects, and the shared start flow shows a notice.
      const places = await fetchRandomPlaces(settings, language);
      await startRoomGame(code, { origin, places });
    });

  return { ...room, startOnlineGame };
};
