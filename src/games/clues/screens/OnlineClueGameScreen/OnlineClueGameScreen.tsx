import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import NoticeOverlay from '@/components/NoticeOverlay';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import { OnlineClueGameScreenView } from './OnlineClueGameScreenView';
import type { OnlineClueGameScreenProps } from './types';
import { useOnlineClueGame } from './useOnlineClueGame';

import { createStyles } from './OnlineClueGameScreen.styles';

/**
 * Online counterpart to `ClueGameScreen`: one phone = one player, one shared board revealed turn
 * by turn instead of Compass' "everyone answers independently, then reveal". Smart container:
 * `useOnlineClueGame()` + every derived label, mapped onto `OnlineClueGameScreenView` (pure
 * rendering).
 */
export const OnlineClueGameScreen = ({ code, onQuit }: OnlineClueGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const router = useRouter();
  const game = useOnlineClueGame(code, onQuit);

  // Only a joiner ever sees this — see Compass' own `OnlineGameScreen` for the full reasoning.
  if (!game.roomExists && !game.isHost) {
    return (
      <SafeAreaView style={styles.loading}>
        <ThemeBackdrop />
        <NoticeOverlay message={t.setup.online.roomDeletedNotice} onDismiss={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const { localUid, onlinePlayers, isHost, roomSettings, gameState, place } = game;

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return (
      <SafeAreaView style={styles.loading}>
        <ThemeBackdrop />
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{t.game.loading}</Text>
      </SafeAreaView>
    );
  }

  if (gameState.screen === 'end') {
    // Always at least 1 connected player. The score is a countdown you win (see `remainingScore`):
    // the HIGHEST total wins, same as the local game's own `finished` screen.
    const standings = onlinePlayers
      .map((player) => ({ name: player.name, total: gameState.totalScores[player.uid] ?? 0 }))
      .sort((a, b) => b.total - a.total);
    const highest = standings[0]?.total ?? 0;
    const winners = standings.filter((entry) => entry.total === highest).map((entry) => entry.name);

    return (
      <Screen>
        <Text style={styles.title}>{t.cluesGame.finalScoreTitle}</Text>
        {onlinePlayers.length > 1 && (
          <Text style={styles.title}>
            {winners.length > 1
              ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `))
              : t.endScreen.winner(winners[0] ?? '')}
          </Text>
        )}
        <Card>
          {standings.map((entry, index) => (
            <View key={entry.name + index} style={[styles.standingRow, index > 0 && styles.standingRowBorder]}>
              <Text style={styles.standingRank}>{index + 1}.</Text>
              <Text style={styles.standingName}>{entry.name}</Text>
              <Text style={styles.standingScore}>
                {formatNumber(entry.total)} {t.common.pts}
              </Text>
            </View>
          ))}
        </Card>
        <Button label={t.cluesGame.home} onPress={game.handleQuit} />
      </Screen>
    );
  }

  const myName = onlinePlayers.find((p) => p.uid === localUid)?.name ?? '';
  const headerScore = `${myName} · ${formatNumber(gameState.totalScores[localUid] ?? 0)} ${t.common.pts}`;
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
      headerScore={headerScore}
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
