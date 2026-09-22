import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSize, spacing } from '@/constants';
import { arcKmFromChordKm, formatBearing, formatNumber } from '@/helpers';
import { useTheme, useThemedStyles } from '@/themes';
import type { EarthMark } from '../EarthSection';
import type { Theme } from '@/types';

import Compass from '../Compass';
import DistanceSlider from '../DistanceSlider';
import EarthSection from '../EarthSection';
import EndScreen from '../EndScreen';
import InclinationSlider from '../InclinationSlider';
import Legend from '../Legend';
import PlaceCard from '../PlaceCard';
import PlayerTabs from '../PlayerTabs';
import RoundResult from '../RoundResult';
import ThemeBackdrop from '../ThemeBackdrop';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Screen from '../ui/Screen';
import {
  ANSWERED_OPACITY,
  LOADING_LABEL,
  QUIT_LABEL,
  REALITY_LABEL,
  REVEAL_OPACITY,
  ROUND_OVER_LABEL,
  VALIDATE_LABEL,
  YOUR_ANSWER_LABEL,
} from './constants';
import { compassSizeFor, earthSizeFor } from './helpers';
import type { GameScreenProps } from './types';
import { useGame } from './useGame';

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
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    quit: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    compass: {
      alignItems: 'center',
      gap: spacing.md,
    },
    readout: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      minHeight: 34,
    },
    earthCard: {
      gap: spacing.md,
    },
    earthCenter: {
      alignItems: 'center',
    },
  });

export const GameScreen = ({ onQuit }: GameScreenProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const game = useGame();

  if (game.phase === 'loading' || game.place === undefined || game.currentPlayer === undefined) {
    return (
      <SafeAreaView style={styles.loading}>
        <ThemeBackdrop />
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>{LOADING_LABEL}</Text>
      </SafeAreaView>
    );
  }

  if (game.phase === 'end') {
    return (
      <EndScreen
        bestScore={game.bestScore}
        isNewBest={game.isNewBest}
        onMenu={onQuit}
        onReplay={game.restart}
        players={game.players}
        records={game.records}
        totals={game.totals}
      />
    );
  }

  const record = game.phase === 'reveal' ? game.currentRecord : undefined;
  const straightLine = game.config.straightLine;
  const playerColor = game.isMultiplayer ? game.currentPlayer.color : undefined;
  const earthSize = earthSizeFor(width);
  const playerColorAt = (index: number) => (game.isMultiplayer ? game.players[index].color : colors.accent);
  // Le curseur donne la corde (ligne droite) en mode straightLine ; la Terre dessine un arc,
  // donc il faut la distance au sol equivalente (meme destination, cf. helpers/geo).
  const earthDistanceKm = (km: number) => (straightLine ? arcKmFromChordKm(km) : km);

  // Reponses deja validees des autres joueurs : montrees sur la boussole et sur la Terre, en estompe.
  const answeredNeedles = game.answered.map((entry) => ({ bearing: entry.guess.bearing, color: entry.player.color }));

  const earthMarks: EarthMark[] = record
    ? [
        {
          bearing: record.results[0].score.trueBearing,
          distanceKm: record.results[0].score.trueSurfaceDistanceKm,
          color: colors.truth,
          isTruth: true,
        },
        ...record.results.map(
          (result, index): EarthMark => ({
            bearing: result.guess.bearing,
            distanceKm: earthDistanceKm(result.guess.distanceKm),
            color: playerColorAt(index),
            opacity: REVEAL_OPACITY,
          }),
        ),
      ]
    : [
        ...game.answered.map(
          (entry): EarthMark => ({
            bearing: entry.guess.bearing,
            distanceKm: earthDistanceKm(entry.guess.distanceKm),
            color: entry.player.color,
            opacity: ANSWERED_OPACITY,
          }),
        ),
        { bearing: game.bearing, distanceKm: earthDistanceKm(game.distanceKm), color: playerColor ?? colors.accent },
      ];

  const legendItems = record
    ? game.isMultiplayer
      ? [
          ...game.players.map((player) => ({ label: player.name, color: player.color })),
          { label: REALITY_LABEL, color: colors.truth, ring: true },
        ]
      : [
          { label: YOUR_ANSWER_LABEL, color: colors.accent },
          { label: REALITY_LABEL, color: colors.truth, ring: true },
        ]
    : game.isMultiplayer
      ? game.answered.map((entry) => ({ label: entry.player.name, color: entry.player.color }))
      : [];

  const scoreLabel = record
    ? game.isMultiplayer
      ? ROUND_OVER_LABEL
      : `${formatNumber(game.totals[0])} pts`
    : `${game.isMultiplayer ? `${game.currentPlayer.name} · ` : ''}${formatNumber(game.totals[game.activePlayerIndex])} pts`;

  return (
    <Screen
      header={
        game.isMultiplayer && !record ? (
          <PlayerTabs
            activeIndex={game.activePlayerIndex}
            allowRevision={game.config.allowRevision}
            answered={game.answeredByPlayer}
            onSelect={game.selectPlayer}
            order={game.roundOrder}
            players={game.players}
          />
        ) : undefined
      }
    >
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
          <Text style={styles.quit}>{QUIT_LABEL}</Text>
        </Pressable>
        <Text style={styles.score}>{scoreLabel}</Text>
      </View>

      <PlaceCard
        originName={game.origin.name}
        place={game.place}
        player={game.isMultiplayer && !record ? game.currentPlayer : undefined}
        roundNumber={game.roundNumber}
        showCountry={game.config.showCountry}
        totalRounds={game.totalRounds}
      />

      <View style={styles.compass}>
        {record ? (
          <Compass
            bearing={game.isMultiplayer ? null : record.results[0].guess.bearing}
            extraNeedles={
              game.isMultiplayer
                ? record.results.map((result, index) => ({ bearing: result.guess.bearing, color: game.players[index].color }))
                : []
            }
            live={game.config.liveCompass}
            size={compassSizeFor(width)}
            truthBearing={record.results[0].score.trueBearing}
          />
        ) : (
          <>
            <Compass
              bearing={game.bearing}
              color={playerColor}
              extraNeedles={answeredNeedles}
              live={game.config.liveCompass}
              onChange={game.setBearing}
              size={compassSizeFor(width)}
            />
            <Text style={styles.readout}>{formatBearing(game.bearing)}</Text>
          </>
        )}
        {legendItems.length > 0 && <Legend items={legendItems} />}
      </View>

      <Card style={styles.earthCard}>
        <View style={styles.earthCenter}>
          <EarthSection marks={earthMarks} showStraightLine={straightLine} size={earthSize} />
        </View>
        {!record &&
          (straightLine ? (
            <InclinationSlider distanceKm={game.distanceKm} maxKm={game.maxDistanceKm} onChange={game.setDistanceKm} />
          ) : (
            <DistanceSlider maxKm={game.maxDistanceKm} onChange={game.setDistanceKm} valueKm={game.distanceKm} />
          ))}
      </Card>

      {record ? (
        <RoundResult
          isLastRound={game.roundNumber === game.totalRounds}
          onNext={game.next}
          options={game.config}
          players={game.players}
          record={record}
        />
      ) : (
        <Button label={VALIDATE_LABEL} onPress={game.submit} />
      )}
    </Screen>
  );
};
