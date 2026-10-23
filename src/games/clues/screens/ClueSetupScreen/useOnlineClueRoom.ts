import { useSetupRoom, type SetupRoomAdapter } from '@/components/setup/useSetupRoom';
import { ROOM_PLAYER_COLORS } from '@/data';
import { resolveOrigin } from '@/helpers';
import { playersByArrival } from '@/helpers/roomPlayers';
import {
  ROOM_MAX_PLAYERS,
  type ClueRoomSettings,
  clueRoomSettingsFrom,
  createRoom,
  deleteRoom,
  isValidRoomCode,
  joinRoomPresence,
  removeRoomPlayer,
  roomExists,
  sendHeartbeat,
  startClueRoomGame,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/clues/firebase/room';
import { fetchClueRoundPlaces } from '@/games/clues/firebase/places';
import { useClueRoomStore } from '@/store/cluesRoomStore';
import { useLanguage, useTranslation } from '@/i18n';
import type { ClueSettings } from '@/types';

const adapter: SetupRoomAdapter<ClueSettings, ClueRoomSettings> = {
  store: useClueRoomStore,
  gamePath: '/clues-online-game',
  colors: ROOM_PLAYER_COLORS,
  maxPlayers: ROOM_MAX_PLAYERS,
  roomSettingsFrom: clueRoomSettingsFrom,
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

/** Cote Indices du setup en ligne : le cycle de la room est `useSetupRoom` (partage) ; seul ce que "Lancer la partie" ecrit est propre ici :
 * le 1er tour (ordre d'arrivee) et tous les lieux d'avance (`fetchClueRoundPlaces`). L'origine est la position de l'appareil ou Paris. */
export const useOnlineClueRoom = (settings: ClueSettings, updateSettings: (patch: Partial<ClueSettings>) => void) => {
  const t = useTranslation();
  const { language } = useLanguage();
  const room = useSetupRoom(adapter, settings, updateSettings);

  const startOnlineClueGame = () =>
    room.startOnlineGame(async (code) => {
      // Lu ici, pas avant : en solo la room (et cet appareil dedans) n'existe qu'a ce moment.
      const firstTurnUid = playersByArrival(useClueRoomStore.getState().players)[0]?.[0];
      if (firstTurnUid === undefined) throw new Error('no player in the room');
      const origin = await resolveOrigin(t.common.yourPosition);
      // Tire depuis Firestore, sans repli : un echec rejette et le flux de lancement partage affiche une notice.
      const places = await fetchClueRoundPlaces(settings, language);
      await startClueRoomGame(code, { origin, places }, firstTurnUid, settings.startWithFirstLetter);
    });

  return { ...room, startOnlineClueGame };
};
