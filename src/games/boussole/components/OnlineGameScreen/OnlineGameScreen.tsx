import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_STRAIGHT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM, PLAYER_COLORS, fontSize, spacing } from '@/constants';
import { arcKmFromChordKm, bearingDeg, distanceKm as computeDistanceKm, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import type { EarthMark } from '@/common/EarthSection';
import { REVEAL_OPACITY } from '../GameScreen/constants';
import EndScreen from '../EndScreen';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import { buildRoundRecord } from './helpers';
import { OnlineAnswerView, OnlineResultsView } from './OnlineGameScreenView';
import type { Needle, OnlineGameScreenProps } from './types';
import { useOnlineGame } from './useOnlineGame';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    loadingText: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    // Same fixed near-black backdrop as SetupScreen's own disconnect notice (not a themed one):
    // reads the same in both themes, and this is the one screen where the theme itself might be
    // about to disappear from under it.
    noticeOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    noticeText: {
      ...typography.heading,
      color: '#FFFFFF',
      fontSize: fontSize.body,
      textAlign: 'center',
    },
  });

/**
 * Online counterpart to `GameScreen`: one phone = one player (no turn-passing, no `PlayerTabs`),
 * guesses submitted to Firestore instead of scored locally. The host's own device runs the exact
 * same "answer, submit" flow as everyone else here — it just also happens to own the scoring
 * effect (inside `useOnlineGame`), since the room's security rules only let the host write
 * `scores`/`screen`. Smart container: `useOnlineGame()` + every derived array/label, mapped onto
 * `OnlineAnswerView`/`OnlineResultsView` (pure rendering).
 */
export const OnlineGameScreen = ({ code, onQuit }: OnlineGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const game = useOnlineGame(code, onQuit);

  if (!game.roomExists) {
    return (
      <Modal animationType="fade" transparent visible>
        <View style={styles.noticeOverlay}>
          <Text style={styles.noticeText}>{t.setup.online.roomDeletedNotice}</Text>
        </View>
      </Modal>
    );
  }

  const { localUid, players, onlinePlayers, isHost, roomSettings, gameState, place, straightLine, totals, myIndex } =
    game;

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return (
      <SafeAreaView style={styles.loading}>
        <ThemeBackdrop />
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{t.game.loading}</Text>
      </SafeAreaView>
    );
  }
  const maxDistanceKm = straightLine ? MAX_STRAIGHT_DISTANCE_KM : MAX_SURFACE_DISTANCE_KM;
  const myColor = players[localUid]?.color ?? PLAYER_COLORS[0];
  const earthDistanceKm = (km: number) => (straightLine ? arcKmFromChordKm(km) : km);
  // Top-right of the header, in every phase: this device's own name and running total — never
  // "Manche terminée" or the like, the player's identity/score is more useful there at a glance.
  const headerScore = `${onlinePlayers[myIndex]?.name ?? ''} · ${formatNumber(totals[myIndex] ?? 0)} ${t.common.pts}`;

  if (gameState.screen === 'end') {
    return (
      <EndScreen onMenu={onQuit} onReplay={onQuit} players={onlinePlayers} records={game.records} totals={totals} />
    );
  }

  // Once this device has submitted, it moves to the *exact same* results-style screen as the
  // official reveal — just with a live, partial version of it: whichever players have answered so
  // far (their needle/mark), the true heading/distance (computed client-side from `origin`/
  // `place`, already known to everyone — no need to wait on the host's `finishRoomRound`
  // round-trip) once the round is fully answered, and a `RoundResult` already in its `pending`
  // shape (see that component) rather than no scores at all — a "waiting" footer stands in for
  // the host's "next round" button until `gameState.screen` actually flips to `'reveal'`.
  const submitted = gameState.screen === 'game' && gameState.guesses[localUid] !== undefined;
  const showResults = gameState.screen === 'reveal' || submitted;

  if (showResults) {
    const confirmedRecord = gameState.screen === 'reveal' ? game.records[game.records.length - 1] : undefined;
    if (gameState.screen === 'reveal' && confirmedRecord === undefined) {
      return (
        <SafeAreaView style={styles.loading}>
          <ThemeBackdrop />
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>{t.game.loading}</Text>
        </SafeAreaView>
      );
    }

    const answeredPlayers = confirmedRecord
      ? onlinePlayers
      : onlinePlayers.filter(({ uid }) => gameState.guesses[uid] !== undefined);
    const allAnswered = confirmedRecord !== undefined || answeredPlayers.length === onlinePlayers.length;
    const guessFor = (uid: string) =>
      confirmedRecord
        ? confirmedRecord.results[onlinePlayers.findIndex((p) => p.uid === uid)].guess
        : gameState.guesses[uid];
    const trueBearing = confirmedRecord
      ? confirmedRecord.results[0].score.trueBearing
      : allAnswered
        ? bearingDeg(gameState.origin.coordinates, place.coordinates)
        : null;
    const trueSurfaceDistanceKm = confirmedRecord
      ? confirmedRecord.results[0].score.trueSurfaceDistanceKm
      : allAnswered
        ? computeDistanceKm(gameState.origin.coordinates, place.coordinates)
        : 0;

    const earthMarks: EarthMark[] = [
      ...(allAnswered
        ? [{ bearing: trueBearing as number, distanceKm: trueSurfaceDistanceKm, color: colors.truth, isTruth: true }]
        : []),
      ...answeredPlayers.map(({ uid, color }): EarthMark => {
        const guess = guessFor(uid);
        return {
          bearing: guess.bearing,
          distanceKm: earthDistanceKm(guess.distanceKm),
          color,
          opacity: confirmedRecord ? REVEAL_OPACITY : undefined,
        };
      }),
    ];
    const extraNeedles: Needle[] = answeredPlayers.map(({ uid, color }) => ({ bearing: guessFor(uid).bearing, color }));
    const isLastRound = gameState.roundIndex + 1 >= gameState.places.length;

    return (
      <OnlineResultsView
        answered={confirmedRecord ? undefined : onlinePlayers.map(({ uid }) => gameState.guesses[uid] !== undefined)}
        compassColor={myColor}
        confirmed={confirmedRecord !== undefined}
        difficulties={roomSettings.difficulties}
        earthMarks={earthMarks}
        extraNeedles={extraNeedles}
        headerScore={headerScore}
        isHost={isHost}
        isLastRound={isLastRound}
        liveCompass={roomSettings.liveCompass}
        localIndex={myIndex}
        onKick={game.kickPlayer}
        onNextRound={game.goToNextRound}
        onQuit={game.handleQuit}
        place={place}
        players={onlinePlayers}
        record={confirmedRecord ?? buildRoundRecord(place, onlinePlayers, gameState.guesses, {})}
        roundNumber={gameState.roundIndex + 1}
        straightLine={straightLine}
        totalRounds={gameState.places.length}
        totals={totals}
        truthBearing={trueBearing}
      />
    );
  }

  // gameState.screen === 'game' and not yet submitted: the only phase with an editable
  // compass/slider — everyone else's answers stay hidden until you've submitted your own (see
  // the results-style branch above), so there's nothing of theirs to show here.
  const earthMarks: EarthMark[] = [
    { bearing: game.bearing, distanceKm: earthDistanceKm(game.distanceKm), color: myColor },
  ];

  return (
    <OnlineAnswerView
      bearing={game.bearing}
      compassColor={myColor}
      difficulties={roomSettings.difficulties}
      distanceKm={game.distanceKm}
      earthMarks={earthMarks}
      headerScore={headerScore}
      liveCompass={roomSettings.liveCompass}
      maxDistanceKm={maxDistanceKm}
      onQuit={game.handleQuit}
      onSetBearing={game.setBearing}
      onSetDistanceKm={game.setDistanceKm}
      onSubmit={game.submit}
      place={place}
      roundNumber={gameState.roundIndex + 1}
      showCountry={roomSettings.showCountry}
      straightLine={straightLine}
      submitDisabled={!game.bearingTouched || !game.distanceTouched}
      totalRounds={gameState.places.length}
    />
  );
};
