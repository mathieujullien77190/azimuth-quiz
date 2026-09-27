import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { arcKmFromChordKm, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { EarthMark } from '@/components/EarthSection';

import EndScreen from '../EndScreen';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import { ANSWERED_OPACITY, REVEAL_OPACITY } from './constants';
import { GameScreenView } from './GameScreenView';
import { onCapFromScroll } from './helpers';
import type { GameScreenProps, Needle } from './types';
import { useGame } from './useGame';
import { createStyles } from './GameScreen.styles';

// Stable reference for the "hide other players' answers" branch: otherwise Legend (memoized)
// re-renders on every compass-drag tick just from getting a fresh empty array each time.
const NO_ANSWERED: ReturnType<typeof useGame>['answered'] = [];

/**
 * Smart container: owns `useGame()`, the scroll orchestration, and every derived array/label —
 * `GameScreenView` (dumb) only ever receives already-resolved values/callbacks.
 */
export const GameScreen = ({ onQuit }: GameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const game = useGame();

  // "Next"/"Previous" navigation: all the way down (heading often off-screen once the distance
  // is shown) / all the way up, not a scroll targeted at a specific section. `onCap` mirrors
  // where the round is actually scrolled to — flipped here for instant feedback on a press, and
  // by `handleScroll` below for a manual drag, so `FooterNav`'s label always matches reality.
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
  // "Submit" moves to the next player (or reveals if it was the last one): either way we
  // scroll back to the top instead of staying scrolled on the previous player's heading/distance.
  const submit = () => {
    setOnCap(false);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
    game.submit();
  };
  // "Next round" also scrolls back to the top, instead of staying scrolled on the
  // previous reveal.
  const next = () => {
    setOnCap(false);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
    game.next();
  };

  const record = game.phase === 'reveal' ? game.currentRecord : undefined;

  // Other players' already-submitted answers: shown on the compass and on the Earth, faded
  // out, unless the "Hide other players' answers" option is on (each player then only sees
  // their own arrow/estimate during the round; the reveal always shows everything either way).
  const showOthersWhileGuessing = !game.config.hideOtherAnswers;
  const answered = showOthersWhileGuessing ? game.answered : NO_ANSWERED;

  // useMemo: passed to Legend (memoized) as `items` — a stable reference (when its own
  // dependencies haven't changed) lets it bail out of re-rendering on every compass-drag tick.
  const legendItems = useMemo(
    () =>
      record
        ? game.isMultiplayer
          ? [
              ...game.players.map((player) => ({ label: player.name, color: player.color })),
              { label: t.game.reality, color: colors.truth, ring: true },
            ]
          : [
              { label: t.game.yourAnswer, color: game.players[0].color },
              { label: t.game.reality, color: colors.truth, ring: true },
            ]
        : game.isMultiplayer
          ? answered.map((entry) => ({ label: entry.player.name, color: entry.player.color }))
          : [],
    [record, game.isMultiplayer, game.players, answered, colors.truth, t.game.reality, t.game.yourAnswer],
  );

  if (game.phase === 'loading' || game.place === undefined || game.currentPlayer === undefined) {
    return (
      <SafeAreaView style={styles.loading}>
        <ThemeBackdrop />
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{t.game.loading}</Text>
      </SafeAreaView>
    );
  }

  if (game.phase === 'end') {
    return (
      <EndScreen
        onMenu={onQuit}
        onReplay={game.restart}
        players={game.players}
        records={game.records}
        totals={game.totals}
      />
    );
  }

  const straightLine = game.config.straightLine;
  // Always the player's real color (the one chosen on the settings screen), even solo: no
  // fallback to colors.accent that would no longer match what was shown at selection.
  const playerColor = game.currentPlayer.color;
  const playerColorAt = (index: number) => game.players[index].color;
  // The slider gives the chord (straight line) in straightLine mode; the Earth draws an arc,
  // so we need the equivalent ground distance (same destination, cf. helpers/geo).
  const earthDistanceKm = (km: number) => (straightLine ? arcKmFromChordKm(km) : km);

  const answeredNeedles: Needle[] = answered.map((entry) => ({
    bearing: entry.guess.bearing,
    color: entry.player.color,
  }));
  const revealNeedles: Needle[] = record
    ? record.results.map((result, index) => ({ bearing: result.guess.bearing, color: game.players[index].color }))
    : [];

  const earthMarks: EarthMark[] = record
    ? [
        {
          bearing: record.results[0].score.trueBearing,
          distanceKm: record.results[0].score.trueSurfaceDistanceKm,
          color: colors.truth,
          isTruth: true,
        },
        ...record.results.map((result, index): EarthMark => ({
          bearing: result.guess.bearing,
          distanceKm: earthDistanceKm(result.guess.distanceKm),
          color: playerColorAt(index),
          opacity: REVEAL_OPACITY,
        })),
      ]
    : [
        ...answered.map((entry): EarthMark => ({
          bearing: entry.guess.bearing,
          distanceKm: earthDistanceKm(entry.guess.distanceKm),
          color: entry.player.color,
          opacity: ANSWERED_OPACITY,
        })),
        { bearing: game.bearing, distanceKm: earthDistanceKm(game.distanceKm), color: playerColor },
      ];

  const scoreLabel = record
    ? game.isMultiplayer
      ? t.game.roundOver
      : `${formatNumber(game.totals[0])} ${t.common.pts}`
    : `${game.isMultiplayer ? `${game.currentPlayer.name} · ` : ''}${formatNumber(game.totals[game.activePlayerIndex])} ${t.common.pts}`;

  return (
    <GameScreenView
      activePlayerIndex={game.activePlayerIndex}
      answeredByPlayer={game.answeredByPlayer}
      answeredNeedles={answeredNeedles}
      bearing={game.bearing}
      config={game.config}
      currentPlayerName={game.currentPlayer.name}
      distanceKm={game.distanceKm}
      earthMarks={earthMarks}
      isLastRound={game.roundNumber === game.totalRounds}
      isMultiplayer={game.isMultiplayer}
      legendItems={legendItems}
      maxDistanceKm={game.maxDistanceKm}
      onCap={onCap}
      onGoToCap={goToCap}
      onGoToDistance={goToDistance}
      onNext={next}
      onQuit={onQuit}
      onScroll={handleScroll}
      onSetBearing={game.setBearing}
      onSetDistanceKm={game.setDistanceKm}
      onSubmit={submit}
      place={game.place}
      players={game.players}
      playerColor={playerColor}
      record={record}
      revealNeedles={revealNeedles}
      roundNumber={game.roundNumber}
      roundOrder={game.roundOrder}
      scoreLabel={scoreLabel}
      scrollRef={scrollRef}
      totalRounds={game.totalRounds}
      totals={game.totals}
      validateDisabled={!game.bearingTouched || !game.distanceTouched}
    />
  );
};
