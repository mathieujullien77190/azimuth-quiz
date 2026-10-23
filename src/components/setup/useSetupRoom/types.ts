import type { PartySectionProps } from '@/components/setup/PartySection';

/**
 * Ce que la room en ligne branche sur Firestore (voir `firebase/room.ts`) ; le store de room (`useRoomStore`) est lu directement. `S` = reglages complets du
 * jeu, `R` = ce que la room partage avec les joiners (tout sauf `playerName`).
 */
export type SetupRoomAdapter<S, R> = {
  /** Route ou l'hote et les joiners sont envoyes quand l'hote lance la partie. */
  gamePath: '/online-game';
  colors: readonly string[];
  maxPlayers: number;
  roomSettingsFrom: (settings: S) => R;
  isValidRoomCode: (code: string) => boolean;
  /** `renew` : l'hote rappuie sur « Creer », il veut un autre code que celui retenu. */
  createRoom: (settings: R, renew?: boolean) => Promise<string>;
  roomExists: (code: string) => Promise<boolean>;
  updateRoomSettings: (code: string, settings: R) => Promise<void>;
  joinRoomPresence: (code: string, name: string) => Promise<string>;
  removeRoomPlayer: (code: string, uid: string) => Promise<void>;
  deleteRoom: (code: string) => Promise<void>;
  sendHeartbeat: (code: string, uid: string) => Promise<void>;
  updateRoomPlayerColors: (code: string, colorByUid: Record<string, string>) => Promise<void>;
};

/**
 * Ce dont `PartySection` a besoin en plus de title/hint (traductions communes, lues par le shell), resolu par
 * `useSetupRoom`.
 */
export type SetupPartyProps = Omit<PartySectionProps, 'title' | 'hint'>;
