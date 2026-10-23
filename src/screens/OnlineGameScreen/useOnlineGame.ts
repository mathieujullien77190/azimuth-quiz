import { reporting } from '@/helpers/errors';
import { useEffect, useRef, useState } from 'react';

import { DEFAULT_DISTANCE_KM } from '@/data/game';
import { originForRound } from '@/helpers/rounds';
import { applyBestBonus, scoreRound } from '@/helpers';
import { useOnlineRoomSession } from '@/helpers/roomHooks';
import {
  deleteRoom,
  finishRoomRound,
  nextRoomRound,
  pruneRoomPlayerData,
  removeRoomPlayer,
  restartRoom,
  sendReaction,
  submitRoomGuess,
} from '@/firebase/room';
import type { RoundRecord, RoundScore } from '@/types';

import type { RoomGameState } from '@/firebase/room';

import { DEFAULT_BEARING } from './constants';
import { buildRoundRecord } from './helpers';

/** Une revelation de manche, telle que la room la portait au moment ou elle s'est affichee. */
type RevealSnapshot = Pick<RoomGameState, 'guesses' | 'scores' | 'totalScores'>;

/**
 * Logique metier de `OnlineGameScreen` : la session de room est `useOnlineRoomSession` commun ; ici le
 * brouillon de reponse et l'historique local des manches, avec des actions deja resolues. Le container
 * calcule les formes pour le JSX, comme `useGame`/`GameScreen.tsx`.
 */
export const useOnlineGame = (code: string, onQuit: () => void) => {
  const {
    localUid,
    players,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    onlinePlayers,
    isHost,
    handleQuit,
    handleReplay,
    reactions,
  } = useOnlineRoomSession(
    { deleteRoom, restartRoom, sendReaction, removeRoomPlayer, pruneRoomPlayerData },
    code,
    onQuit,
  );
  // Manche en cours dans la room (celle que l'hote fait avancer) ; l'ecran montre `shown`, voir plus bas.
  const place = gameState.places[gameState.roundIndex];

  // Reponse en cours de cet appareil, remise a zero a chaque manche. Ajustee au rendu plutot qu'en effet
  // (evite un rendu de plus).
  const [bearing, setBearingState] = useState(DEFAULT_BEARING);
  const [distanceKm, setDistanceKmState] = useState(DEFAULT_DISTANCE_KM);
  const [bearingTouched, setBearingTouched] = useState(false);
  const [distanceTouched, setDistanceTouched] = useState(false);
  const [draftRoundIndex, setDraftRoundIndex] = useState(gameState.roundIndex);
  if (gameState.roundIndex !== draftRoundIndex) {
    setDraftRoundIndex(gameState.roundIndex);
    setBearingState(DEFAULT_BEARING);
    setDistanceKmState(DEFAULT_DISTANCE_KM);
    setBearingTouched(false);
    setDistanceTouched(false);
  }
  const setBearing = (value: number) => {
    setBearingState(value);
    setBearingTouched(true);
  };
  const setDistanceKm = (value: number) => {
    setDistanceKmState(value);
    setDistanceTouched(true);
  };

  // Chaque appareil accumule les manches vues au reveal, dans la forme attendue par
  // `RoundResult`/`EndScreen` : la room ne garde que la manche courante, c'est la seule copie.
  const [records, setRecords] = useState<RoundRecord[]>([]);
  // Meme revelation gardee en entier (reponses, scores, totaux) : la room la remplace des que l'hote passe a la suite.
  const [snapshots, setSnapshots] = useState<Record<number, RevealSnapshot>>({});
  const lastRecordedRoundRef = useRef(-1);
  useEffect(() => {
    const scores = gameState.scores;
    if (gameState.screen !== 'reveal' || scores === null || place === undefined) return;
    if (lastRecordedRoundRef.current === gameState.roundIndex) return;
    lastRecordedRoundRef.current = gameState.roundIndex;
    setRecords((previous) => [...previous, buildRoundRecord(place, onlinePlayers, gameState.guesses, scores)]);
    setSnapshots((previous) => ({
      ...previous,
      [gameState.roundIndex]: { guesses: gameState.guesses, scores, totalScores: gameState.totalScores },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.screen, gameState.scores, gameState.roundIndex, gameState.guesses, place]);

  // Hote seul : une fois tout le monde repondu, note la manche (contre l'origine de l'hote, voir
  // `startOnlineGame`) et passe au reveal. Garde par une ref (pas un etat) : une rafale de snapshots ne
  // doit pas le declencher deux fois.
  const finishedRoundRef = useRef(-1);
  useEffect(() => {
    const origin = originForRound(gameState, roomSettings?.travel);
    if (!isHost || gameState.screen !== 'game' || origin === null || place === undefined) return;
    if (finishedRoundRef.current === gameState.roundIndex) return;
    if (onlinePlayers.length === 0) return;
    const allAnswered = onlinePlayers.every(({ uid }) => gameState.guesses[uid] !== undefined);
    if (!allAnswered) return;

    finishedRoundRef.current = gameState.roundIndex;
    const results = applyBestBonus(
      onlinePlayers.map(({ uid }) => {
        const guess = gameState.guesses[uid];
        return {
          guess,
          score: scoreRound(origin, place, guess),
        };
      }),
    );
    const scores: Record<string, RoundScore> = {};
    const totalScores: Record<string, number> = {};
    onlinePlayers.forEach(({ uid }, index) => {
      scores[uid] = results[index].score;
      totalScores[uid] = (gameState.totalScores[uid] ?? 0) + results[index].score.total;
    });
    finishRoomRound(code, scores, totalScores).catch(reporting('game.finishRound', { kind: 'background', room: code }));
  }, [isHost, gameState, roomSettings?.travel, onlinePlayers, place, code]);

  // Indexe par uid, pas par position dans `records` : l'hote l'ecrit dans la room apres chaque manche, donc
  // il survit a une expulsion qui reordonne `onlinePlayers` ou a un arrivant tardif sans historique.
  // Manche regardee par cet appareil. L'hote avance avec la room ; un joueur dont l'hote est deja passe a la manche
  // suivante reste sur le resultat qu'il regarde (revelation gardee en local) et passe quand il appuie sur le bouton.
  // Sans revelation gardee (arrive en retard, rechargement), il suit la room.
  const [viewedRound, setViewedRound] = useState(gameState.roundIndex);
  const viewedSnapshot = snapshots[viewedRound];
  const behind = !isHost && viewedRound < gameState.roundIndex && viewedSnapshot !== undefined;
  if (!behind && viewedRound !== gameState.roundIndex) setViewedRound(gameState.roundIndex);
  const shown: RoomGameState =
    behind && viewedSnapshot !== undefined
      ? { ...gameState, ...viewedSnapshot, roundIndex: viewedRound, screen: 'reveal' }
      : gameState;
  const shownPlace = shown.places[shown.roundIndex];
  const advance = () => setViewedRound(gameState.roundIndex);

  const totals = onlinePlayers.map(({ uid }) => shown.totalScores[uid] ?? 0);
  const myIndex = onlinePlayers.findIndex((p) => p.uid === localUid);

  const submit = async () => {
    if (localUid === null) return;
    const guess = { bearing, distanceKm };
    await submitRoomGuess(code, localUid, guess).catch(reporting('game.submitGuess', { room: code }));
  };

  // Hote seul : expulse un joueur en cours de partie, jamais soi-meme (voir `handleQuit`).
  const kickPlayer = isHost
    ? (index: number) => {
        const uid = onlinePlayers[index]?.uid;
        if (uid !== undefined && uid !== localUid)
          removeRoomPlayer(code, uid).catch(reporting('game.kickPlayer', { room: code }));
      }
    : undefined;

  const goToNextRound = () =>
    nextRoomRound(code, gameState.roundIndex + 1, gameState.places.length).catch(
      reporting('game.nextRound', { room: code }),
    );

  return {
    localUid,
    players,
    onlinePlayers,
    isHost,
    connectionLost,
    connected,
    roomSettings,
    gameState: shown,
    place: shownPlace,
    canContinue: behind,
    advance,
    bearing,
    distanceKm,
    bearingTouched,
    distanceTouched,
    setBearing,
    setDistanceKm,
    records,
    totals,
    myIndex,
    handleQuit,
    handleReplay,
    reactions,
    submit,
    kickPlayer,
    goToNextRound,
  };
};
