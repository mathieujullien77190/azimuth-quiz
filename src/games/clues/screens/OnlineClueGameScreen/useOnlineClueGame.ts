import { reporting } from '@/helpers/reportError';
import { useCallback, useEffect, useRef, useState } from 'react';

import { bearingDeg, distanceKm, nameSkeleton } from '@/helpers';
import { useDebouncedValue } from '@/helpers/useDebouncedValue';
import { hasGuessedThisTurn, missIsFresh } from '@/helpers/turnGuess';
import { useDevFeedback } from '@/helpers/useDevFeedback';
import { nextPlayerUid, playersForRound } from '@/helpers/roomPlayers';
import { useGuessDraft } from '@/helpers/useGuessDraft';
import { useHostTurnRecovery } from '@/helpers/useHostTurnRecovery';
import { useHostTurnScoring } from '@/helpers/useHostTurnScoring';
import { useOnlineRoomSession } from '@/helpers/useOnlineRoomSession';
import {
  applyClueRoomScore,
  deleteRoom,
  giveUpClueRoom,
  nextClueRoomRound,
  passRoomTurn,
  pickClueRoomClue,
  pruneRoomPlayerData,
  removeRoomPlayer,
  restartRoom,
  sendReaction,
  reportClueRoomCorrect,
  reportClueRoomWrong,
  setClueRoomTyping,
} from '@/games/clues/firebase/room';
import { WRONG_ANSWER_PENALTY } from '@/games/clues/constants';
import { normalizePlaceGuess, remainingScore } from '@/games/clues/helpers/clueGame';
import { useClueRoomStore } from '@/store/cluesRoomStore';
import type { ClueId } from '@/types';

/** Logique metier en ligne derriere `OnlineClueGameScreen` : la session de room est `useOnlineRoomSession` (partage) ; ici le brouillon
 * de cet appareil et des actions deja gardees par "mon tour" / "je suis l'hote". Le container calcule les formes JSX. */
export const useOnlineClueGame = (code: string, onQuit: () => void) => {
  const { localUid, players, connectionLost, connected, roomSettings, gameState, onlinePlayers, isHost, handleQuit, handleReplay, reactions } =
    useOnlineRoomSession(useClueRoomStore, { deleteRoom, restartRoom, sendReaction, removeRoomPlayer, pruneRoomPlayerData }, code, onQuit);

  const place = gameState.places[gameState.roundIndex];
  const isMyTurn = localUid !== null && localUid === gameState.turnUid;
  // Une proposition par tour : apres une erreur il ne reste qu'un indice a devoiler. L'etat partage (`wrongGuessHints`) le dit partout ;
  // le verrou local couvre l'instant avant le retour de la room (double tap).
  const hintsOut = gameState.revealedClueIds.length;
  const [guessGuard, setGuessGuard] = useState<{ round: number; hints: number } | null>(null);
  const guessedThisTurn =
    isMyTurn &&
    (hasGuessedThisTurn(gameState, hintsOut) ||
      (guessGuard !== null && guessGuard.round === gameState.roundIndex && guessGuard.hints === hintsOut));
  // Ordre de jeu de la manche : ordre d'arrivee decale par la manche (`playersForRound`), aussi celui des onglets.
  const roundPlayers = playersForRound(onlinePlayers, gameState.roundIndex);

  // Brouillon de proposition de cet appareil.
  const { guessText, setGuessText } = useGuessDraft(gameState.roundIndex, gameState.turnUid);

  // Qui vient de se tromper, pour tous. `wrongGuessSeq` ne fait que croitre (l'hote s'y appuie, voir `useHostTurnScoring`) :
  // une base prise une fois par manche distingue une erreur de cette manche d'une ancienne.
  // Garde par `turnUid` aussi : l'erreur cesse d'etre "courante" quand le tour de son auteur finit.
  const [wrongSeqRoundIndex, setWrongSeqRoundIndex] = useState(gameState.roundIndex);
  const [wrongSeqAtRoundStart, setWrongSeqAtRoundStart] = useState(gameState.wrongGuessSeq);
  if (wrongSeqRoundIndex !== gameState.roundIndex) {
    setWrongSeqRoundIndex(gameState.roundIndex);
    setWrongSeqAtRoundStart(gameState.wrongGuessSeq);
  }
  const wrongGuesserName =
    gameState.wrongGuessUid !== null &&
    gameState.wrongGuessUid === gameState.turnUid &&
    gameState.wrongGuessSeq > wrongSeqAtRoundStart &&
    // Disparait chez tous des qu'un indice sort apres l'erreur (`wrongGuessHints`, voir `turnGuess.ts`).
    missIsFresh(gameState.wrongGuessHints, hintsOut)
      ? (onlinePlayers.find((player) => player.uid === gameState.wrongGuessUid)?.name ?? null)
      : null;

  // Copie le brouillon dans la room ~500 ms apres sa derniere modification, pour que les autres le voient en direct (`typing`).
  // Pas d'ecriture en solo, en spectateur ni manche finie ; `lastWrittenRef` evite de reecrire une valeur inchangee.
  const debouncedGuessText = useDebouncedValue(guessText, 500);
  // Commence a '' (pas null) : un champ intact ne declenche pas d'ecriture au premier rendu.
  const lastWrittenTypingRef = useRef('');
  useEffect(() => {
    if (!isMyTurn || localUid === null || gameState.verdict !== null || onlinePlayers.length <= 1) return;
    if (lastWrittenTypingRef.current === debouncedGuessText) return;
    lastWrittenTypingRef.current = debouncedGuessText;
    setClueRoomTyping(code, localUid, debouncedGuessText).catch(
      reporting('clues.typing', { kind: 'background', room: code }),
    );
  }, [debouncedGuessText, isMyTurn, localUid, gameState.verdict, onlinePlayers.length, code]);

  // Pour un spectateur du detenteur du tour courant : `typing.uid` est verifie contre `turnUid` car jamais remis a zero au changement de tour.
  const typedByActivePlayer =
    !isMyTurn && gameState.verdict === null && gameState.typing !== null && gameState.typing.uid === gameState.turnUid
      ? gameState.typing.text
      : '';

  const originReady = gameState.origin !== null && place !== undefined;
  const bearing = originReady ? bearingDeg(gameState.origin!.coordinates, place!.coordinates) : 0;
  const distance = originReady ? distanceKm(gameState.origin!.coordinates, place!.coordinates) : 0;

  const letterStage = gameState.revealedClueIds.filter((id) => id === 'letter').length;
  const vowelsRevealed = gameState.revealedClueIds.includes('vowels');
  const skeletonLengthKnown = letterStage >= 2 || vowelsRevealed;
  const skeletonGroups =
    place !== undefined && letterStage >= 1
      ? nameSkeleton(place.name, {
          groupByWord: letterStage >= 2 || vowelsRevealed,
          lengthKnown: skeletonLengthKnown,
          revealVowels: vowelsRevealed,
        })
      : [];

  // `place` est brievement undefined au chargement (splash dans OnlineClueGameScreen.tsx) : 0 n'est jamais montre.
  const remaining = place !== undefined ? remainingScore(gameState.revealedClueIds, place) : 0;

  // Hote seul : le detenteur du tour annonce trouve/rate, ceci est le seul ecrivain de `totalScores` (voir `applyClueRoomScore`).
  const applyScore = useCallback(
    (totalScores: Record<string, number>) => applyClueRoomScore(code, totalScores),
    [code],
  );
  useHostTurnScoring(isHost, gameState, remaining, WRONG_ANSWER_PENALTY, applyScore);
  const passTurn = useCallback((uid: string) => passRoomTurn(code, uid), [code]);
  useHostTurnRecovery(isHost, gameState, roundPlayers, passTurn);

  const pickClue = (clueId: ClueId) => {
    if (!isMyTurn || localUid === null) return;
    const nextTurnUid = nextPlayerUid(onlinePlayers, localUid);
    if (nextTurnUid === undefined) return;
    pickClueRoomClue(code, [...gameState.revealedClueIds, clueId], nextTurnUid).catch(
      reporting('clues.pickClue', { room: code }),
    );
  };

  const submitGuess = () => {
    if (!isMyTurn || guessedThisTurn || localUid === null || place === undefined) return;
    const correct = normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name);
    if (correct) {
      reportClueRoomCorrect(code, localUid).catch(reporting('clues.reportCorrect', { room: code }));
      return;
    }
    setGuessGuard({ round: gameState.roundIndex, hints: hintsOut });
    reportClueRoomWrong(code, localUid, gameState.wrongGuessSeq + 1, hintsOut).catch(
      reporting('clues.reportWrong', { room: code }),
    );
    setGuessText('');
  };

  // Hote seul, meme hors de son tour : coupe la manche. Les regles l'autorisent (`isHost()` avant `turnBasedPlayer`), aucun changement de regle.
  const giveUp = () => {
    if (!isHost) return;
    giveUpClueRoom(code).catch(reporting('clues.giveUp', { room: code }));
  };

  const goToNextRound = () => {
    if (!isHost) return;
    const nextRoundIndex = gameState.roundIndex + 1;
    // Ordre de la manche suivante : le joueur apres l'ouvreur de celle-ci prend la tete.
    const firstTurnUid = playersForRound(onlinePlayers, nextRoundIndex)[0]?.uid;
    if (firstTurnUid === undefined) return;
    nextClueRoomRound(
      code,
      nextRoundIndex,
      gameState.places.length,
      firstTurnUid,
      roomSettings?.startWithFirstLetter ?? false,
    ).catch(reporting('clues.nextRound', { room: code }));
  };

  // Mode dev : une fois l'hote passe a la suite (ou partie finie), l'appareil avec le code dev juge la difficulte du lieu.
  const devFeedback = useDevFeedback({
    game: 'clues',
    roundIndex: gameState.roundIndex,
    roundOver: gameState.verdict !== null,
    gameOver: gameState.screen === 'end',
    target:
      place === undefined
        ? undefined
        : { targetType: 'place', targetKey: place.key, name: place.name, difficulty: place.difficulty },
  });

  return {
    localUid,
    players,
    onlinePlayers,
    roundPlayers,
    isHost,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    place,
    bearing,
    distance,
    origin: gameState.origin?.coordinates,
    isMyTurn,
    guessedThisTurn,
    typedByActivePlayer,
    skeletonGroups,
    skeletonLengthKnown,
    remaining,
    guessText,
    setGuessText,
    wrongGuesserName,
    pickClue,
    submitGuess,
    giveUp,
    goToNextRound,
    handleQuit,
    handleReplay,
    reactions,
    devFeedback,
  };
};
