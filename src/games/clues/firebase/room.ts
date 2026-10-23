import { onSnapshot, updateDoc } from 'firebase/firestore';

import type { ClueId, ClueSettings, CluePlace, Origin } from '@/types';

import { createRoomApi } from '@/firebase/roomApi';

// Hors barrel de `helpers/index.ts` : `firebase/firestore` est ESM seul et fait planter Jest (voir `firebase/client.ts`).
// Indices : un plateau partage devoile tour a tour, pas le "chacun repond puis reveal" de Compass.
// Le cycle de vie de la room est `createRoomApi` ; seul l'etat de manche est propre a Indices.

export {
  ROOM_MAX_PLAYERS,
  type RoomPlayer as ClueRoomPlayer,
  type RoomPlayers as ClueRoomPlayers,
} from '@/firebase/roomApi';
export { isValidRoomCode } from '@/firebase/roomCode';

/** Ce que la room partage avec les joiners : tous les reglages sauf `playerName`, local a chaque joueur. */
export type ClueRoomSettings = Omit<ClueSettings, 'playerName'>;

export const clueRoomSettingsFrom = (settings: ClueSettings): ClueRoomSettings => {
  const { playerName, ...roomSettings } = settings;
  return roomSettings;
};

const rooms = createRoomApi<ClueRoomSettings>('clues');
export const {
  createRoom,
  roomExists,
  updateRoomSettings,
  subscribeToRoomSettings,
  joinRoomPresence,
  removeRoomPlayer,
  deleteRoom,
  restartRoom,
  sendReaction,
  pruneRoomPlayerData,
  sendHeartbeat,
  passRoomTurn,
  updateRoomPlayerColors,
} = rooms;
const { roomRef } = rooms;

/** Ecran montre par la room (`'options'` par defaut si absent). Pas de `'reveal'` : la fin de manche se lit dans `verdict`,
 * le plateau etant le meme pour tous en permanence. */
export type ClueRoomScreen = 'options' | 'game' | 'end';

/** Voir `subscribeToRoomPlayers` de `createRoomApi`, type avec les ecrans d'Indices. */
export const subscribeToRoomPlayers = rooms.subscribeToRoomPlayers<ClueRoomScreen>;

/** Ce que l'hote ecrit au lancement : l'origine partagee et le lieu de chaque manche, tires d'avance (`pickClueRoundPlaces`). */
export type ClueRoomGamePayload = { origin: Origin; places: CluePlace[] };

const initialRevealedClueIds = (startWithFirstLetter: boolean): ClueId[] => (startWithFirstLetter ? ['letter'] : []);

/** Hote seul : lance la partie ; le premier arrive (`onlinePlayersFrom`) a le premier tour. */
export const startClueRoomGame = (
  code: string,
  payload: ClueRoomGamePayload,
  firstTurnUid: string,
  startWithFirstLetter: boolean,
): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: 'game' satisfies ClueRoomScreen,
    origin: payload.origin,
    places: payload.places,
    roundIndex: 0,
    revealedClueIds: initialRevealedClueIds(startWithFirstLetter),
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    wrongGuessUid: null,
    wrongGuessSeq: 0,
    wrongGuessHints: null,
    totalScores: {},
    typing: null,
  });

/** Detenteur du tour seul (regles : `request.auth.uid == resource.data.turnUid`) : devoile un indice et passe la main.
 * `revealedClueIds` est le tableau deja complete cote appareil, pas `arrayUnion` (il dedupliquerait les indices a etapes). */
export const pickClueRoomClue = (code: string, revealedClueIds: ClueId[], nextTurnUid: string): Promise<void> =>
  updateDoc(roomRef(code), { revealedClueIds, turnUid: nextTurnUid });

/** Detenteur du tour seul : copie sa saisie pour les autres (voir `useOnlineClueGame`, debounce ~500 ms, ecrit seulement si change). */
export const setClueRoomTyping = (code: string, uid: string, text: string): Promise<void> =>
  updateDoc(roomRef(code), { typing: { uid, text } satisfies ClueRoomGameState['typing'] });

/** Detenteur du tour seul : annonce avoir trouve, la manche finit. Le score est calcule et ecrit par l'hote seul (voir `applyClueRoomScore`). */
export const reportClueRoomCorrect = (code: string, uid: string): Promise<void> =>
  updateDoc(roomRef(code), { verdict: 'correct' satisfies ClueRoomGameState['verdict'], roundWinnerUid: uid });

/** Detenteur du tour seul : abandonne, la manche finit, aucun score ne bouge. */
export const giveUpClueRoom = (code: string): Promise<void> =>
  updateDoc(roomRef(code), { verdict: 'giveUp' satisfies ClueRoomGameState['verdict'] });

/** Detenteur du tour seul : annonce une erreur (la manche reste ouverte). La penalite est ecrite par l'hote seul.
 * `hintsRevealed` = indices sortis (regle "une proposition par tour"). `seq` doit etre > `wrongGuessSeq` de la room,
 * pour distinguer deux erreurs d'un meme joueur d'un renvoi. */
export const reportClueRoomWrong = (code: string, uid: string, seq: number, hintsRevealed: number): Promise<void> =>
  updateDoc(roomRef(code), { wrongGuessUid: uid, wrongGuessSeq: seq, wrongGuessHints: hintsRevealed });

/** Hote seul : ecrit les totaux (apres `verdict === 'correct'` ou `wrongGuessSeq` qui avance) ; seul ecrivain de `totalScores`. */
export const applyClueRoomScore = (code: string, totalScores: Record<string, number>): Promise<void> =>
  updateDoc(roomRef(code), { totalScores });

/** Hote seul : manche suivante (plateau neuf, 1er tour au suivant dans la rotation, voir `playersForRound`) ou fin de partie. */
export const nextClueRoomRound = (
  code: string,
  roundIndex: number,
  placeCount: number,
  firstTurnUid: string,
  startWithFirstLetter: boolean,
): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: (roundIndex < placeCount ? 'game' : 'end') satisfies ClueRoomScreen,
    roundIndex,
    revealedClueIds: initialRevealedClueIds(startWithFirstLetter),
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    // Nouvelle manche sans proposition : la regle "une proposition par tour" le lit (voir `turnGuess.ts`).
    wrongGuessHints: null,
    typing: null,
  });

export type ClueRoomGameState = {
  screen: ClueRoomScreen;
  origin: Origin | null;
  places: CluePlace[];
  roundIndex: number;
  revealedClueIds: ClueId[];
  turnUid: string | null;
  verdict: 'correct' | 'giveUp' | null;
  roundWinnerUid: string | null;
  /** Derniere erreur annoncee (voir `reportClueRoomWrong`), jamais remise a zero : `wrongGuessSeq` ne fait que croitre, l'hote ne re-applique pas une erreur. */
  wrongGuessUid: string | null;
  wrongGuessSeq: number;
  /** Indices sortis lors de cette erreur : pas de nouvelle proposition avant un indice de plus. Null/absent = pas de restriction. */
  wrongGuessHints: number | null;
  totalScores: Record<string, number>;
  /** Saisie du detenteur du tour, en direct (voir `setClueRoomTyping`), `null` si rien ecrit. A croiser avec `turnUid` : jamais remis a zero au changement de tour. */
  typing: { uid: string; text: string } | null;
};

/** Etat de manche en direct. Ignore la mise a jour une fois la room supprimee (comme `subscribeToRoomGame` de Compass). */
export const subscribeToRoomGame = (code: string, onUpdate: (state: ClueRoomGameState) => void): (() => void) =>
  onSnapshot(roomRef(code), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    onUpdate({
      screen: (data?.screen as ClueRoomScreen | undefined) ?? 'options',
      origin: (data?.origin as Origin | undefined) ?? null,
      places: (data?.places as CluePlace[] | undefined) ?? [],
      roundIndex: (data?.roundIndex as number | undefined) ?? 0,
      revealedClueIds: (data?.revealedClueIds as ClueId[] | undefined) ?? [],
      turnUid: (data?.turnUid as string | undefined) ?? null,
      verdict: (data?.verdict as ClueRoomGameState['verdict'] | undefined) ?? null,
      roundWinnerUid: (data?.roundWinnerUid as string | undefined) ?? null,
      wrongGuessUid: (data?.wrongGuessUid as string | undefined) ?? null,
      wrongGuessSeq: (data?.wrongGuessSeq as number | undefined) ?? 0,
      wrongGuessHints: (data?.wrongGuessHints as number | undefined) ?? null,
      totalScores: (data?.totalScores as Record<string, number> | undefined) ?? {},
      typing: (data?.typing as ClueRoomGameState['typing'] | undefined) ?? null,
    });
  });
