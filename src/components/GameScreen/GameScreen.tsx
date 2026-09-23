import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSize, spacing } from '@/constants';
import { arcKmFromChordKm, formatBearing, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
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
import { ANSWERED_OPACITY, MAX_PROGRESS_DOTS, REVEAL_OPACITY } from './constants';
import { compassSizeFor, earthSizeFor, formatRoundProgress } from './helpers';
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
    header: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
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
    roundRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    roundLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    progress: {
      flexDirection: 'row',
      gap: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotDone: {
      backgroundColor: colors.accent,
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
    footerRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    validateFlex: {
      flex: 1,
    },
  });

type FooterNavProps = {
  onGoToCap: () => void;
  onGoToDistance: () => void;
  validateDisabled: boolean;
  onValidate: () => void;
};

/**
 * Bouton "Suivant"/"Precedent" (un seul affiche a la fois, selon la section vers laquelle on a
 * navigue en dernier) a cote de "Valider". Monte avec une `key` differente a chaque manche/joueur
 * (voir l'appel dans `GameScreen`) : repart donc toujours sur "Suivant" sans effet ni ref-pendant-
 * le-rendu, juste le remontage standard React quand la key change.
 */
const FooterNav = ({ onGoToCap, onGoToDistance, validateDisabled, onValidate }: FooterNavProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const [onCap, setOnCap] = useState(false);

  return (
    <View style={styles.footerRow}>
      {onCap ? (
        <Button
          label={t.game.previousStep}
          onPress={() => {
            setOnCap(false);
            onGoToDistance();
          }}
          variant="ghost"
        />
      ) : (
        <Button
          label={t.game.nextStep}
          onPress={() => {
            setOnCap(true);
            onGoToCap();
          }}
          variant="ghost"
        />
      )}
      <View style={styles.validateFlex}>
        <Button disabled={validateDisabled} label={t.game.validate} onPress={onValidate} />
      </View>
    </View>
  );
};

export const GameScreen = ({ onQuit }: GameScreenProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const game = useGame();

  // Navigation "Suivant"/"Precedent" : tout en bas (cap souvent hors ecran une fois la distance
  // affichee) / tout en haut, pas un scroll cible sur une section precise.
  const scrollRef = useRef<ScrollView>(null);
  const goToCap = () => scrollRef.current?.scrollToEnd({ animated: true });
  const goToDistance = () => scrollRef.current?.scrollTo({ animated: true, y: 0 });
  // Changer de joueur repart en haut de l'ecran : sinon on reste scrolle sur le cap/la distance du
  // joueur precedent, ce qui n'a plus de sens pour le nouveau.
  const selectPlayer = (index: number) => {
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
    game.selectPlayer(index);
  };

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
  // Toujours la couleur reelle du joueur (celle choisie a l'ecran de reglages), meme en solo : pas
  // de repli sur colors.accent qui ne correspondrait plus a ce qui a ete montre a la selection.
  const playerColor = game.currentPlayer.color;
  const earthSize = earthSizeFor(width);
  const playerColorAt = (index: number) => game.players[index].color;
  // Le curseur donne la corde (ligne droite) en mode straightLine ; la Terre dessine un arc,
  // donc il faut la distance au sol equivalente (meme destination, cf. helpers/geo).
  const earthDistanceKm = (km: number) => (straightLine ? arcKmFromChordKm(km) : km);

  // Reponses deja validees des autres joueurs : montrees sur la boussole et sur la Terre, en
  // estompe, sauf si l'option "Cacher les reponses des autres" est active (chacun ne voit alors
  // que sa propre fleche/estimation pendant la manche ; la revelation, elle, montre toujours tout).
  const showOthersWhileGuessing = !game.config.hideOtherAnswers;
  const answered = showOthersWhileGuessing ? game.answered : [];
  const answeredNeedles = answered.map((entry) => ({ bearing: entry.guess.bearing, color: entry.player.color }));

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
        ...answered.map(
          (entry): EarthMark => ({
            bearing: entry.guess.bearing,
            distanceKm: earthDistanceKm(entry.guess.distanceKm),
            color: entry.player.color,
            opacity: ANSWERED_OPACITY,
          }),
        ),
        { bearing: game.bearing, distanceKm: earthDistanceKm(game.distanceKm), color: playerColor },
      ];

  const legendItems = record
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
      : [];

  const scoreLabel = record
    ? game.isMultiplayer
      ? t.game.roundOver
      : `${formatNumber(game.totals[0])} ${t.common.pts}`
    : `${game.isMultiplayer ? `${game.currentPlayer.name} · ` : ''}${formatNumber(game.totals[game.activePlayerIndex])} ${t.common.pts}`;

  return (
    <Screen
      footer={
        record ? (
          <Button
            label={game.roundNumber === game.totalRounds ? t.game.last : t.game.next}
            onPress={game.next}
          />
        ) : (
          <FooterNav
            key={`${game.roundNumber}-${game.activePlayerIndex}`}
            onGoToCap={goToCap}
            onGoToDistance={goToDistance}
            onValidate={game.submit}
            validateDisabled={!game.bearingTouched || !game.distanceTouched}
          />
        )
      }
      scrollRef={scrollRef}
      header={
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
              <Text style={styles.quit}>{t.game.quit}</Text>
            </Pressable>
            <Text style={styles.score}>{scoreLabel}</Text>
          </View>

          <View style={styles.roundRow}>
            <Text style={styles.roundLabel}>
              {t.game.round} {formatRoundProgress(game.roundNumber, game.totalRounds)}
            </Text>
            {game.totalRounds <= MAX_PROGRESS_DOTS && (
              <View style={styles.progress}>
                {Array.from({ length: game.totalRounds }, (_, index) => (
                  <View key={index} style={[styles.dot, index < game.roundNumber && styles.dotDone]} />
                ))}
              </View>
            )}
          </View>

          {game.isMultiplayer && !record && (
            <PlayerTabs
              activeIndex={game.activePlayerIndex}
              activeLabel={t.game.playerTurn}
              allowRevision={game.config.allowRevision}
              answered={game.answeredByPlayer}
              onSelect={selectPlayer}
              order={game.roundOrder}
              players={game.players}
            />
          )}
        </View>
      }
    >
      <PlaceCard
        key={game.roundNumber}
        description={record ? game.place.description : undefined}
        place={game.place}
        showCountry={game.config.showCountry || record !== undefined}
      />

      <View style={styles.compass}>
        {record ? (
          <Compass
            bearing={game.isMultiplayer ? null : record.results[0].guess.bearing}
            color={playerColor}
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
            <Text style={styles.readout}>{formatBearing(game.bearing, t.cardinals)}</Text>
          </>
        )}
        {legendItems.length > 0 && <Legend items={legendItems} />}
      </View>

      <Card style={styles.earthCard}>
        <View style={styles.earthCenter}>
          <EarthSection
            key={game.roundNumber}
            marks={earthMarks}
            showStraightLine={straightLine}
            size={earthSize}
            zoomControls={record !== undefined}
          />
        </View>
        {!record &&
          (straightLine ? (
            <InclinationSlider distanceKm={game.distanceKm} maxKm={game.maxDistanceKm} onChange={game.setDistanceKm} />
          ) : (
            <DistanceSlider maxKm={game.maxDistanceKm} onChange={game.setDistanceKm} valueKm={game.distanceKm} />
          ))}
      </Card>

      {record && <RoundResult options={game.config} players={game.players} record={record} totals={game.totals} />}
    </Screen>
  );
};
