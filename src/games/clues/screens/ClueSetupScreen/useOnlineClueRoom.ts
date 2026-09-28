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
  startClueRoomGame,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/clues/helpers/room';
import { useClueRoomStore } from '@/games/clues/store/roomStore';
import { useLanguage, useTranslation } from '@/i18n';
import type { ClueSettings } from '@/types';

import { pickClueRoundPlaces } from './helpers';

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
  updateRoomPlayerColors,
};

/** Clues' side of the online setup: the room lifecycle is `useSetupRoom`'s (shared with Compass),
 * only what "Lancer la partie" writes is specific — it also has to pick who gets the first turn
 * (arrival order) and the whole game's places upfront (`pickClueRoundPlaces`), since Clues has no
 * per-player independent guess: one shared board, revealed turn by turn. The shared origin is
 * always the device position or Paris (Clues has no `useGps`/custom-origin setting). */
export const useOnlineClueRoom = (settings: ClueSettings, updateSettings: (patch: Partial<ClueSettings>) => void) => {
  const t = useTranslation();
  const { language } = useLanguage();
  const room = useSetupRoom(adapter, settings, updateSettings);

  const startOnlineClueGame = () =>
    room.startOnlineGame(async (code) => {
      // Read here, not before: in solo the room only exists (and lists this device) by the time this runs.
      const firstTurnUid = playersByArrival(useClueRoomStore.getState().players)[0]?.[0];
      if (firstTurnUid === undefined) throw new Error('no player in the room');
      const origin = await resolveOrigin(t.common.yourPosition);
      const places = pickClueRoundPlaces(settings.rounds, settings.difficulty, settings.categories, language);
      await startClueRoomGame(code, { origin, places }, firstTurnUid, settings.startWithFirstLetter);
    });

  return { ...room, startOnlineClueGame };
};
