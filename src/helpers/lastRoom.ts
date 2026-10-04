import AsyncStorage from '@react-native-async-storage/async-storage';

import { LAST_JOINED_ROOM_STORAGE_KEY } from '@/data';

// Kept out of `helpers/roomCode.ts` (and of the barrel): it needs nothing but AsyncStorage, which keeps it free of the
// Firebase imports that file drags in.

/** The code of the room this device joined last (a joiner's "previous game"), if it kept one. */
export const loadLastJoinedRoom = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_JOINED_ROOM_STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Remembers the room this device just joined, to offer joining it again next time. Not critical if it fails. */
export const saveLastJoinedRoom = async (code: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_JOINED_ROOM_STORAGE_KEY, code);
  } catch {
    // Not remembered: no "join the previous game" shortcut next time.
  }
};
