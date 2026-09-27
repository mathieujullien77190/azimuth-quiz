import type { RoomPlayers } from '@/games/compass/helpers/room';

// A type-only import from `room.ts` is erased at compile time, so it never actually pulls in
// `firebase/firestore` at runtime — safe for this dumb component to use for this shape alone,
// unlike importing any of `room.ts`'s actual values/functions (see SetupScreenView's own
// `SetupScreenPlayer`, the same trick).
export type PartySectionPlayer = RoomPlayers[string];

export type PartySectionProps = {
  /** Differs per game's own translation namespace once a game other than Compass adopts online
   * play (`t.setup.playersSection.title` today; the "online" sub-labels below stay shared). */
  title: string;
  hint?: string;

  soloName: string;
  soloPlaceholder: string;
  soloColor: string;
  /** Locked once actually connected to a room (host or joiner) — renaming mid-game isn't
   * supported, see SetupScreen's own comment on `connectedRoomCode`. */
  nameEditable: boolean;
  onChangeName: (text: string) => void;

  connectedPlayers: [string, PartySectionPlayer][];
  localUid: string | null;
  hostUid: string | null;
  isHost: boolean;
  onKick: (uid: string) => void;

  onlineChoice: 'host' | 'join' | null;
  onChooseSolo: () => void;
  onChooseHost: () => void;
  onChooseJoin: () => void;
  roomCode: string | null;
  joinCode: string;
  onJoinCodeChange: (text: string) => void;
  joinCodeIsValid: boolean;
  joinStatus: 'idle' | 'valid' | 'invalid';
};
