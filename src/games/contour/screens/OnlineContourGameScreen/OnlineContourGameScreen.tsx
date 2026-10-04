import { useTransientFlag } from '@/helpers/useTransientFlag';
import { useTranslation } from '@/i18n';

import FinalStandings from '@/components/FinalStandings';
import NoticeOverlay from '@/components/NoticeOverlay';
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
/** How long the "it's not your turn" notice stays up (a tap closes it earlier). */
const NOT_YOUR_TURN_NOTICE_MS = 4000;

export const OnlineContourGameScreen = ({ code, onQuit }: OnlineContourGameScreenProps) => {
  const t = useTranslation();
  const game = useOnlineContourGame(code, onQuit);
  // Tapping a hint or the answer field out of turn: a short notice, closing by itself or on a tap.
  const notYourTurn = useTransientFlag(NOT_YOUR_TURN_NOTICE_MS);

  // The host just quit: the store is already reset, and this screen is only on its way out. Not the
  // "loading" splash below — that one is for a room that hasn't delivered its state yet.
  if (!game.connected) return null;

  // Whoever loses the connection leaves the game — host included (see `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // The host deleting the room is no early return: a joiner keeps seeing the round it was in, under the
  // "the host left" notice `useSetupRoom` shows (it also sends the joiner home, on a tap or after a
  // couple of seconds) — the last state the room delivered is still in the store.

  const { localUid, onlinePlayers, roundPlayers, isHost, roomSettings, gameState, country } = game;

  // The final standings come first: once the last round is over `roundIndex` points past the rounds, so
  // there is no round left to load — reading that as "not ready yet" showed the loading splash instead.
  if (gameState.screen === 'end') {
    return (
      <FinalStandings
        entries={onlinePlayers.map((player) => ({
          name: player.name,
          total: gameState.totalScores[player.uid] ?? 0,
          color: player.color,
        }))}
        localName={onlinePlayers.find((player) => player.uid === localUid)?.name ?? ''}
        onQuit={game.handleQuit}
        onReplay={game.handleReplay}
        title={t.endScreen.title}
      />
    );
  }

  // The round's country could not be read: a tap tries again (nothing else can show without it).
  if (game.roundFailed && country === undefined)
    return <NoticeOverlay message={t.contourGame.loadFailed} onDismiss={game.retryRound} />;

  if (localUid === null || roomSettings === null || country === undefined)
    return <NoticeOverlay loading message={t.game.loading} />;

  const myName = onlinePlayers.find((player) => player.uid === localUid)?.name ?? '';
  // The tabs follow the round's order (`roundPlayers`), so the turn index is read on that list.
  const turnIndex = roundPlayers.findIndex((player) => player.uid === gameState.turnUid);
  const winnerName =
    gameState.roundWinnerUid !== null
      ? onlinePlayers.find((player) => player.uid === gameState.roundWinnerUid)?.name
      : undefined;

  return (
    <OnlineContourGameScreenView
      country={country}
      neighborCountries={game.neighborCountries}
      difficulty={roomSettings.difficulty}
      guessText={game.guessText}
      name={myName}
      points={gameState.totalScores[localUid] ?? 0}
      hintGroups={game.hintGroups}
      hintsRevealed={gameState.hintsRevealed}
      plan={game.plan}
      simplifySeed={game.simplifySeed}
      isHost={isHost}
      isLastRound={gameState.roundIndex + 1 >= gameState.countryCodes.length}
      isMyTurn={game.isMyTurn}
      lastWrong={game.lastWrong}
      typedByActivePlayer={game.typedByActivePlayer}
      notice={notYourTurn.visible ? t.contourGame.notYourTurn(roundPlayers[turnIndex]?.name ?? '') : null}
      onDismissNotice={notYourTurn.hide}
      onNotYourTurn={notYourTurn.show}
      onChangeGuessText={game.setGuessText}
      onGiveUp={game.giveUp}
      onNextRound={game.goToNextRound}
      onQuit={game.handleQuit}
      onRevealHint={game.isMyTurn ? game.revealHint : notYourTurn.show}
      onSubmitGuess={game.submitGuess}
      players={roundPlayers}
      pointsAtStake={game.pointsAtStake}
      roomCode={code}
      roundNumber={gameState.roundIndex + 1}
      totalRounds={gameState.countryCodes.length}
      turnIndex={turnIndex}
      verdict={gameState.verdict ?? undefined}
      winnerName={winnerName}
    />
  );
};
