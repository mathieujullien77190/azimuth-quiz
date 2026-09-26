import { useEffect, useMemo, useRef, useState } from 'react';
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
import RoundProgress from '../ui/RoundProgress';
import Screen from '../ui/Screen';
import { ANSWERED_OPACITY, REVEAL_OPACITY } from './constants';
import { compassSizeFor, earthSizeFor } from './helpers';
import type { GameScreenProps } from './types';
import { useGame } from './useGame';

// Stable reference for the "hide other players' answers" branch: otherwise Legend (memoized)
// re-renders on every compass-drag tick just from getting a fresh empty array each time.
const NO_ANSWERED: ReturnType<typeof useGame>['answered'] = [];

const createStyles = ({ colors, isDark, typography }: Theme) =>
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
      // White by day rather than the page's own light-blue background (see Screen's footer,
      // same fix): a fixed bar reads better as its own surface than a washed-out page extension.
      backgroundColor: isDark ? colors.background : colors.surface,
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
    turnPopupOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      elevation: 20,
      backgroundColor: 'rgba(11, 18, 32, 0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    turnPopupText: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      textAlign: 'center',
    },
  });

type TurnPopupProps = {
  name: string;
};

/**
 * Annonce "A X de jouer" plein ecran au debut de chaque manche (multijoueur) : reste affiche
 * tant qu'on ne touche pas l'ecran, pas de disparition automatique. Monte avec une `key`
 * differente a chaque manche/joueur (voir l'appel plus bas) : repart donc toujours visible, sans
 * effet ni ref-pendant-le-rendu, juste le remontage standard React quand la key change.
 */
const TurnPopup = ({ name }: TurnPopupProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={styles.turnPopupOverlay}>
      <Text style={styles.turnPopupText}>{t.game.playerTurn(name)}</Text>
    </Pressable>
  );
};

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

  // "Next"/"Previous" navigation: all the way down (heading often off-screen once the distance
  // is shown) / all the way up, not a scroll targeted at a specific section.
  const scrollRef = useRef<ScrollView>(null);
  const goToCap = () => scrollRef.current?.scrollToEnd({ animated: true });
  const goToDistance = () => scrollRef.current?.scrollTo({ animated: true, y: 0 });
  // "Submit" moves to the next player (or reveals if it was the last one): either way we
  // scroll back to the top instead of staying scrolled on the previous player's heading/distance.
  const submit = () => {
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
    game.submit();
  };
  // "Next round" also scrolls back to the top, instead of staying scrolled on the
  // previous reveal.
  const next = () => {
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
    game.next();
  };

  const record = game.phase === 'reveal' ? game.currentRecord : undefined;
  // Everyone has submitted: the reveal scrolls back to the top, instead of staying scrolled
  // on the section where the last player submitted.
  useEffect(() => {
    if (record) scrollRef.current?.scrollTo({ animated: true, y: 0 });
  }, [record]);

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
  const earthSize = earthSizeFor(width);
  const playerColorAt = (index: number) => game.players[index].color;
  // The slider gives the chord (straight line) in straightLine mode; the Earth draws an arc,
  // so we need the equivalent ground distance (same destination, cf. helpers/geo).
  const earthDistanceKm = (km: number) => (straightLine ? arcKmFromChordKm(km) : km);

  const answeredNeedles = answered.map((entry) => ({ bearing: entry.guess.bearing, color: entry.player.color }));

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
    <>
      <Screen
        footer={
          record ? (
            <Button label={game.roundNumber === game.totalRounds ? t.game.last : t.game.next} onPress={next} />
          ) : (
            <FooterNav
              key={`${game.roundNumber}-${game.activePlayerIndex}`}
              onGoToCap={goToCap}
              onGoToDistance={goToDistance}
              onValidate={submit}
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

            <RoundProgress difficulties={game.config.difficulties} roundNumber={game.roundNumber} totalRounds={game.totalRounds} />

            {game.isMultiplayer && !record && (
              <PlayerTabs
                activeIndex={game.activePlayerIndex}
                activeLabel={t.game.playerTurn}
                answered={game.answeredByPlayer}
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
                  ? record.results.map((result, index) => ({
                      bearing: result.guess.bearing,
                      color: game.players[index].color,
                    }))
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
              <InclinationSlider
                distanceKm={game.distanceKm}
                maxKm={game.maxDistanceKm}
                onChange={game.setDistanceKm}
              />
            ) : (
              <DistanceSlider maxKm={game.maxDistanceKm} onChange={game.setDistanceKm} valueKm={game.distanceKm} />
            ))}
        </Card>

        {record && <RoundResult options={game.config} players={game.players} record={record} totals={game.totals} />}
      </Screen>

      {game.isMultiplayer && !record && <TurnPopup key={game.roundNumber} name={game.currentPlayer.name} />}
    </>
  );
};
