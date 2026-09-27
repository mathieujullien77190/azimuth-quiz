import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLAYER_COLORS } from '@/data';
import { MAX_STRAIGHT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import { arcKmFromChordKm, bearingDeg, distanceKm as computeDistanceKm, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import type { EarthMark } from '@/components/EarthSection';
import { REVEAL_OPACITY } from '../GameScreen/constants';
import EndScreen from '../EndScreen';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import { buildRoundRecord } from './helpers';
import { onCapFromScroll } from '../GameScreen/helpers';
import { OnlineAnswerView, OnlineResultsView } from './OnlineGameScreenView';
import type { Needle, OnlineGameScreenProps } from './types';
import { useOnlineGame } from './useOnlineGame';

import { createStyles } from './OnlineGameScreen.styles';

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

  // Same "Suivant"/"Precedent" scroll nav as the local GameScreen (see its own comment) — kept
  // above every early return below so the hook order never depends on which phase we're in.
  const scrollRef = useRef<ScrollView>(null);
  const [onCap, setOnCap] = useState(false);
  const goToCap = () => {
    setOnCap(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  };
  const goToDistance = () => {
    setOnCap(false);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
  };
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = onCapFromScroll(event);
    if (next !== null) setOnCap(next);
  };

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
      onCap={onCap}
      onGoToCap={goToCap}
      onGoToDistance={goToDistance}
      onQuit={game.handleQuit}
      onScroll={handleScroll}
      onSetBearing={game.setBearing}
      onSetDistanceKm={game.setDistanceKm}
      onSubmit={game.submit}
      place={place}
      roundNumber={gameState.roundIndex + 1}
      scrollRef={scrollRef}
      showCountry={roomSettings.showCountry}
      straightLine={straightLine}
      submitDisabled={!game.bearingTouched || !game.distanceTouched}
      totalRounds={gameState.places.length}
    />
  );
};
