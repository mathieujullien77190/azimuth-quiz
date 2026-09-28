import { playersByArrival, useSetupRoom, type SetupRoomAdapter } from '@/components/setup/useSetupRoom';
import { CLUE_ROOM_PLAYER_COLORS } from '@/games/clues/constants';
import { resolveOrigin } from '@/helpers';
import {
  CLUE_ROOM_MAX_PLAYERS,
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
  colors: CLUE_ROOM_PLAYER_COLORS,
  maxPlayers: CLUE_ROOM_MAX_PLAYERS,
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

  const startOnlineClueGame = async () => {
    const firstTurnUid = playersByArrival(useClueRoomStore.getState().players)[0]?.[0];
    if (firstTurnUid === undefined) return;

    await room.startOnlineGame(async (code) => {
      const origin = await resolveOrigin(t.common.yourPosition);
      const places = pickClueRoundPlaces(settings.rounds, settings.difficulty, settings.categories, language);
      await startClueRoomGame(code, { origin, places }, firstTurnUid, settings.startWithFirstLetter);
    });
  };

  return { ...room, startOnlineClueGame };
};
