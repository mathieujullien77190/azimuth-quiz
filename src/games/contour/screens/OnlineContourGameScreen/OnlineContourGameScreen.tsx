import { useTranslation } from '@/i18n';

import FinalStandings from '@/components/FinalStandings';
import LoadingScreen from '@/components/LoadingScreen';
import RoomDeletedScreen from '@/components/RoomDeletedScreen';
import { OnlineContourGameScreenView } from './OnlineContourGameScreenView';
import type { OnlineContourGameScreenProps } from './types';
import { useOnlineContourGame } from './useOnlineContourGame';

/**
 * Online counterpart to `ContourGameScreen`, modeled on Clues' `OnlineClueGameScreen`: one phone =
 * one player, one shared board whose hints get revealed turn by turn. Smart container:
 * `useOnlineContourGame()` + every derived label, mapped onto `OnlineContourGameScreenView` (pure
 * rendering).
 */
export const OnlineContourGameScreen = ({ code, onQuit }: OnlineContourGameScreenProps) => {
  const t = useTranslation();
  const game = useOnlineContourGame(code, onQuit);

  // Whoever loses the connection leaves the game — host included (see `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // Only a joiner ever sees this — see `RoomDeletedScreen` for the full reasoning.
  if (!game.roomExists && !game.isHost) return <RoomDeletedScreen />;

  const { localUid, onlinePlayers, isHost, roomSettings, gameState, country } = game;

  if (localUid === null || roomSettings === null || country === undefined) return <LoadingScreen />;

  if (gameState.screen === 'end') {
    return (
      <FinalStandings
        entries={onlinePlayers.map((player) => ({ name: player.name, total: gameState.totalScores[player.uid] ?? 0 }))}
        homeLabel={t.contourGame.home}
        onHome={game.handleQuit}
        title={t.contourGame.finalScoreTitle}
      />
    );
  }

  const myName = onlinePlayers.find((player) => player.uid === localUid)?.name ?? '';
  const turnIndex = onlinePlayers.findIndex((player) => player.uid === gameState.turnUid);
  const winnerName =
    gameState.roundWinnerUid !== null
      ? onlinePlayers.find((player) => player.uid === gameState.roundWinnerUid)?.name
      : undefined;

  return (
    <OnlineContourGameScreenView
      country={country}
      difficulty={roomSettings.difficulty}
      guessText={game.guessText}
      name={myName}
      points={gameState.totalScores[localUid] ?? 0}
      hintsRevealed={gameState.hintsRevealed}
      isHost={isHost}
      isLastRound={gameState.roundIndex + 1 >= gameState.countryCodes.length}
      isMyTurn={game.isMyTurn}
      lastWrong={game.lastWrong}
      onChangeGuessText={game.setGuessText}
      onGiveUp={game.giveUp}
      onNextRound={game.goToNextRound}
      onQuit={game.handleQuit}
      onRevealHint={game.revealHint}
      onSubmitGuess={game.submitGuess}
      players={onlinePlayers}
      pointsAtStake={game.pointsAtStake}
      roomCode={code}
      roundNumber={gameState.roundIndex + 1}
      totalRounds={gameState.countryCodes.length}
      turnIndex={turnIndex}
      turnPlayerName={onlinePlayers[turnIndex]?.name ?? ''}
      verdict={gameState.verdict ?? undefined}
      winnerName={winnerName}
    />
  );
};
