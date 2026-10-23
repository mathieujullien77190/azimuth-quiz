import { useSetupRoom, type SetupRoomAdapter } from '@/components/setup/useSetupRoom';
import { ROOM_PLAYER_COLORS } from '@/data';
import { resolveOrigin } from '@/helpers';
import { fetchRandomPlaces } from '@/games/compass/firebase/places';
import { separateRepeats } from '@/games/compass/helpers/originForRound';
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
} from '@/games/compass/firebase/room';
import { useRoomStore } from '@/store/compassRoomStore';
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

/**
 * Cote Compass de la room en ligne : le cycle de vie est `useSetupRoom` (commun avec Clues) ; seul ce que
 * "Lancer la partie" ecrit est propre : le GPS/position de l'hote (jamais un joiner) sert de reference, et
 * l'hote tire tous les lieux (`fetchRandomPlaces`, sans repli : l'echec rejette et `useSetupRoom` affiche
 * la notice).
 */
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
      // Tire dans Firestore sans repli : l'echec rejette, le flux commun affiche une notice.
      const drawn = await fetchRandomPlaces(settings, language);
      // Mode voyage : chaque manche part du lieu precedent, pas de lieu deux fois de suite.
      const places = settings.travel ? separateRepeats(drawn) : drawn;
      await startRoomGame(code, { origin, places });
    });

  return { ...room, startOnlineGame };
};
