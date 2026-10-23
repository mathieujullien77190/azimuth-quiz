import type { RoomPlayers } from '@/firebase/room';

// Un import de type depuis `room.ts` est efface a la compilation : il ne tire pas `firebase/firestore` a
// l'execution, donc sans danger pour ce composant dumb (meme astuce que `SetupScreenPlayer` de SetupScreenView).
export type PartySectionPlayer = RoomPlayers[string];

export type PartySectionProps = {
  /**
   * Propre au namespace de chaque jeu (`t.setup.playersSection.title` aujourd'hui ; les sous-libelles « en ligne »
   * restent communs).
   */
  title: string;
  hint?: string;

  soloName: string;
  soloPlaceholder: string;
  soloColor: string;
  /**
   * Verrouille une fois connecte a une room (hote ou joiner) : pas de renommage en cours de partie, voir
   * `connectedRoomCode` dans SetupScreen.
   */
  nameEditable: boolean;
  onChangeName: (text: string) => void;
  /** Pourquoi le nom est refuse (« deja pris »), affiche sous le champ ; null s'il est accepte. */
  nameError?: string | null;

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
