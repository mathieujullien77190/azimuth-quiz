import type { RoomPlayers } from '../firebase/roomApi';

// Hors `roomBase.ts` (qui importe `firebase/firestore`, inutilisable dans un test Jest ou un hook pur).

/** `code` de l'erreur de `joinRoomPresence` quand le nom est deja pris. */
const NAME_TAKEN_CODE = 'name-taken';

export const nameTakenError = (): Error =>
  Object.assign(new Error('That name is already taken in this room.'), { code: NAME_TAKEN_CODE });

export const isNameTakenError = (error: unknown): boolean =>
  error instanceof Error && (error as Error & { code?: string }).code === NAME_TAKEN_CODE;

const normalized = (name: string): string => name.trim().toLowerCase();

/** Un autre joueur a-t-il deja ce nom (casse et espaces autour ignores) ? `uid` = soi, jamais compte. */
export const isNameTaken = (name: string, players: RoomPlayers, uid: string): boolean =>
  Object.entries(players).some(
    ([otherUid, player]) => otherUid !== uid && normalized(player.name) === normalized(name),
  );

/** Premier de `placeholders` libre, pour qui n'a pas tape de nom (`uid` = soi, ignore) ; le premier si tous pris. */
export const freePlaceholder = (placeholders: readonly string[], players: RoomPlayers, uid: string | null): string =>
  placeholders.find((placeholder) => !isNameTaken(placeholder, players, uid ?? '')) ?? placeholders[0];
