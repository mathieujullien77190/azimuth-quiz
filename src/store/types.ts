import type { RoomPlayers, RoomReaction } from '../firebase/roomApi';

// Import de type seul : efface a la compilation, ce dossier ne tire pas `firebase/firestore` a l'execution
// (chaque store recoit ses abonnements de `games/<game>/firebase/room.ts`, que Jest mocke).

export type RoomStoreActions = {
  /**
   * Idempotent. Ouvre les trois abonnements (joueurs, reglages, jeu) partages par tous les ecrans ; seul l'ecran de preparation
   * possede ce cycle (`useSetupRoom`), l'ecran de jeu lit seulement.
   */
  connect: (code: string) => void;
  /** Ferme les trois listeners et remet les defauts. */
  disconnect: () => void;
  /**
   * Pose par `useRoomPresence` a la perte de connexion (la sienne, ou celle de l'hote pour un joiner) : la partie est finie,
   * les ecrans notifient et rentrent. Remis a zero a connect/disconnect.
   */
  markConnectionLost: () => void;
  /**
   * A appeler juste avant de retirer sa propre presence volontairement : sinon l'ecran de preparation l'interprete comme
   * une expulsion et affiche la notice "expulse".
   */
  markVoluntaryLeave: () => void;
  /** Lit et efface le drapeau pose par `markVoluntaryLeave`. */
  consumeVoluntaryLeave: () => boolean;
};

export type RoomStoreData<Settings, GameState> = {
  code: string | null;
  players: RoomPlayers;
  hostUid: string | null;
  /** Faux quand la room a existe puis disparu (hote parti) ; reste vrai tant qu'elle n'a pas charge. */
  roomExists: boolean;
  roomSettings: Settings | null;
  gameState: GameState;
  /** Dernier emoji envoye a la room, ou null (`useRoomReactions`). */
  reaction: RoomReaction | null;
  /** Non resolu ici : le `joinRoomPresence` de l'ecran de preparation le resout deja (meme session anonyme) et le pousse via `setState`. */
  localUid: string | null;
  connectionLost: boolean;
};

export type RoomStoreState<Settings, GameState> = RoomStoreData<Settings, GameState> & RoomStoreActions;

export type RoomStoreConfig<Settings, GameState> = {
  defaultGameState: GameState;
  subscribeToRoomPlayers: (
    code: string,
    onUpdate: (
      players: RoomPlayers,
      hostUid: string | undefined,
      exists: boolean,
      screen?: string,
      reaction?: RoomReaction | null,
    ) => void,
  ) => () => void;
  subscribeToRoomSettings: (code: string, onSettings: (settings: Settings) => void) => () => void;
  subscribeToRoomGame: (code: string, onUpdate: (state: GameState) => void) => () => void;
};

/** Ce qu'un ecran lit dans le store de room d'un jeu (et pour quitter). */
export type RoomStoreHook<Settings, GameState> = {
  <U>(selector: (state: RoomStoreState<Settings, GameState>) => U): U;
  getState: () => RoomStoreState<Settings, GameState>;
};
