import { useTranslation } from '@/i18n';

import FinalStandings from '@/components/FinalStandings';
import LoadingScreen from '@/components/LoadingScreen';
import RoomDeletedScreen from '@/components/RoomDeletedScreen';
import { OnlineClueGameScreenView } from './OnlineClueGameScreenView';
import type { OnlineClueGameScreenProps } from './types';
import { useOnlineClueGame } from './useOnlineClueGame';

/**
 * Online counterpart to `ClueGameScreen`: one phone = one player, one shared board revealed turn
 * by turn instead of Compass' "everyone answers independently, then reveal". Smart container:
 * `useOnlineClueGame()` + every derived label, mapped onto `OnlineClueGameScreenView` (pure
 * rendering).
 */
export const OnlineClueGameScreen = ({ code, onQuit }: OnlineClueGameScreenProps) => {
  const t = useTranslation();
  const game = useOnlineClueGame(code, onQuit);

  // Whoever loses the connection leaves the game — host included (see `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // Only a joiner ever sees this — see Compass' own `OnlineGameScreen` for the full reasoning.
  if (!game.roomExists && !game.isHost) {
    return <RoomDeletedScreen />;
  }

  const { localUid, onlinePlayers, isHost, roomSettings, gameState, place } = game;

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return <LoadingScreen />;
  }

  if (gameState.screen === 'end') {
    // The score is a countdown you win (see `remainingScore`): the HIGHEST total wins, same as the
    // local game's own `finished` screen.
    return (
      <FinalStandings
        entries={onlinePlayers.map((player) => ({ name: player.name, total: gameState.totalScores[player.uid] ?? 0 }))}
        homeLabel={t.cluesGame.home}
        onHome={game.handleQuit}
        title={t.cluesGame.finalScoreTitle}
      />
    );
  }

  const myName = onlinePlayers.find((p) => p.uid === localUid)?.name ?? '';
  const turnIndex = onlinePlayers.findIndex((p) => p.uid === gameState.turnUid);
  const turnPlayerName = onlinePlayers[turnIndex]?.name ?? '';
  const winnerName =
    gameState.roundWinnerUid !== null
      ? (onlinePlayers.find((p) => p.uid === gameState.roundWinnerUid)?.name ?? '')
      : undefined;
  const isLastRound = gameState.roundIndex + 1 >= gameState.places.length;

  return (
    <OnlineClueGameScreenView
      bearingDeg={game.bearing}
      difficulty={roomSettings.difficulty}
      distanceKm={game.distance}
      guessText={game.guessText}
      name={myName}
      points={gameState.totalScores[localUid] ?? 0}
      roomCode={code}
      isHost={isHost}
      isLastRound={isLastRound}
      isMyTurn={game.isMyTurn}
      lastWrong={game.lastWrong}
      onChangeGuessText={game.setGuessText}
      onGiveUp={game.giveUp}
      onNextRound={game.goToNextRound}
      onPickClue={game.pickClue}
      onQuit={game.handleQuit}
      onSubmitGuess={game.submitGuess}
      place={place}
      players={onlinePlayers}
      remaining={game.remaining}
      revealedClueIds={gameState.revealedClueIds}
      roundNumber={gameState.roundIndex + 1}
      skeletonGroups={game.skeletonGroups}
      skeletonLengthKnown={game.skeletonLengthKnown}
      totalRounds={gameState.places.length}
      turnIndex={turnIndex}
      turnPlayerName={turnPlayerName}
      verdict={gameState.verdict ?? undefined}
      winnerName={winnerName}
    />
  );
};
