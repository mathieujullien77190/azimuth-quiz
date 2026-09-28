import { useTransientFlag } from '@/helpers/useTransientFlag';
import { useTranslation } from '@/i18n';

import FinalStandings from '@/components/FinalStandings';
import Button from '@/components/ui/Button';
import NoticeOverlay from '@/components/NoticeOverlay';
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
  // Tapping a clue when it isn't your turn: a short notice, closing by itself or on a tap.
  const notYourTurn = useTransientFlag();

  // The host just quit: the store is already reset, and this screen is only on its way out. Not the
  // "loading" splash below — that one is for a room that hasn't delivered its state yet.
  if (!game.connected) return null;

  // Whoever loses the connection leaves the game — host included (see `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // The host deleting the room is no early return: a joiner keeps seeing the round it was in, under the
  // "the host left" notice `useSetupRoom` shows (it also sends the joiner home, on a tap or after a
  // couple of seconds) — the last state the room delivered is still in the store.

  const { localUid, onlinePlayers, isHost, roomSettings, gameState, place } = game;

  // The final standings come first: once the last round is over `roundIndex` points past the rounds, so
  // there is no round left to load — reading that as "not ready yet" showed the loading splash instead.
  if (gameState.screen === 'end') {
    // The score is a countdown you win (see `remainingScore`): the HIGHEST total wins, same as the
    // local game's own `finished` screen.
    return (
      <FinalStandings
        entries={onlinePlayers.map((player) => ({
          name: player.name,
          total: gameState.totalScores[player.uid] ?? 0,
          color: player.color,
        }))}
        title={t.endScreen.title}
      >
        <Button label={t.endScreen.menu} onPress={game.handleQuit} />
      </FinalStandings>
    );
  }

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return <NoticeOverlay loading message={t.game.loading} />;
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
      notice={notYourTurn.visible ? t.cluesGame.notYourTurn(turnPlayerName) : null}
      onDismissNotice={notYourTurn.hide}
      onPickClue={game.isMyTurn ? game.pickClue : notYourTurn.show}
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
      verdict={gameState.verdict ?? undefined}
      winnerName={winnerName}
    />
  );
};
