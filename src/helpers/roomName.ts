import type { RoomPlayers } from './roomBase';

// Kept out of `roomBase.ts` (which imports `firebase/firestore`, and so can't be required by a Jest
// test or a pure screen hook): this is only about names and errors.

/** The `code` of the error `joinRoomPresence` throws when the name is already someone else's. */
export const NAME_TAKEN_CODE = 'name-taken';

export const nameTakenError = (): Error =>
  Object.assign(new Error('That name is already taken in this room.'), { code: NAME_TAKEN_CODE });

export const isNameTakenError = (error: unknown): boolean =>
  error instanceof Error && (error as Error & { code?: string }).code === NAME_TAKEN_CODE;

const normalized = (name: string): string => name.trim().toLowerCase();

/** Whether another player of the room already has this name — compared without caring about case or
 * the spaces around it ("Zoé " is "zoé"). `uid` is this player's own entry, which never counts (renaming
 * to the name one already has is fine). */
export const isNameTaken = (name: string, players: RoomPlayers, uid: string): boolean =>
  Object.entries(players).some(
    ([otherUid, player]) => otherUid !== uid && normalized(player.name) === normalized(name),
  );

/** The first of `placeholders` that no other player of the room has — what a player who typed no name
 * is called. `uid` is this player's own entry, which never counts (it keeps the name it already got).
 * Falls back to the first one if they are all taken. */
export const freePlaceholder = (placeholders: readonly string[], players: RoomPlayers, uid: string | null): string =>
  placeholders.find((placeholder) => !isNameTaken(placeholder, players, uid ?? '')) ?? placeholders[0];
