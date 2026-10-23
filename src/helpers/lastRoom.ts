import AsyncStorage from '@react-native-async-storage/async-storage';

import { LAST_JOINED_ROOM_STORAGE_KEY } from '@/data';

// Hors de `firebase/roomCode.ts` et du barrel : seul AsyncStorage est requis, sans les imports Firebase de ce fichier.

/** Code de la derniere room rejointe (« partie precedente » d'un joiner), s'il est garde. */
export const loadLastJoinedRoom = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_JOINED_ROOM_STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Retient la room rejointe pour proposer de la rejoindre ; un echec est sans gravite. */
export const saveLastJoinedRoom = async (code: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_JOINED_ROOM_STORAGE_KEY, code);
  } catch {
    // Non retenu : pas de raccourci « rejoindre la partie precedente ».
  }
};
