import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { formatBearing } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Compass from '../Compass';
import DistanceSlider from '../DistanceSlider';
import EarthSection from '../EarthSection';
import InclinationSlider from '../InclinationSlider';
import Legend from '../Legend';
import PlaceCard from '../PlaceCard';
import PlayerTabs from '../PlayerTabs';
import RoundResult from '../RoundResult';
import Button from '../ui/Button';
import Card from '../ui/Card';
import RoundProgress from '../ui/RoundProgress';
import Screen from '../ui/Screen';
import { compassSizeFor, earthSizeFor } from './helpers';
import type { GameScreenViewProps } from './types';

const createStyles = ({ colors, isDark, typography }: Theme) =>
  StyleSheet.create({
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
export const TurnPopup = ({ name }: TurnPopupProps) => {
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
 * (voir l'appel dans `GameScreenView`) : repart donc toujours sur "Suivant" sans effet ni ref-
 * pendant-le-rendu, juste le remontage standard React quand la key change.
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

/**
 * Pur rendu : aucun hook a effet de bord (pas de `useGame`) — `GameScreen` (smart) resout tout en
 * amont (phase, valeurs derivees) et ce composant ne fait qu'afficher/emettre des evenements.
 */
export const GameScreenView = ({
  scrollRef,
  onQuit,
  scoreLabel,
  config,
  roundNumber,
  totalRounds,
  isMultiplayer,
  record,
  activePlayerIndex,
  answeredByPlayer,
  roundOrder,
  players,
  currentPlayerName,
  place,
  playerColor,
  bearing,
  onSetBearing,
  answeredNeedles,
  revealNeedles,
  legendItems,
  earthMarks,
  distanceKm,
  onSetDistanceKm,
  maxDistanceKm,
  totals,
  isLastRound,
  onNext,
  onGoToCap,
  onGoToDistance,
  onSubmit,
  validateDisabled,
}: GameScreenViewProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const straightLine = config.straightLine;

  return (
    <>
      <Screen
        footer={
          record ? (
            <Button label={isLastRound ? t.game.last : t.game.next} onPress={onNext} />
          ) : (
            <FooterNav
              key={`${roundNumber}-${activePlayerIndex}`}
              onGoToCap={onGoToCap}
              onGoToDistance={onGoToDistance}
              onValidate={onSubmit}
              validateDisabled={validateDisabled}
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

            <RoundProgress difficulties={config.difficulties} roundNumber={roundNumber} totalRounds={totalRounds} />

            {isMultiplayer && !record && (
              <PlayerTabs
                activeIndex={activePlayerIndex}
                activeLabel={t.game.playerTurn}
                answered={answeredByPlayer}
                order={roundOrder}
                players={players}
              />
            )}
          </View>
        }
      >
        <PlaceCard
          key={roundNumber}
          description={record ? place.description : undefined}
          place={place}
          showCountry={config.showCountry || record !== undefined}
        />

        <View style={styles.compass}>
          {record ? (
            <Compass
              bearing={isMultiplayer ? null : record.results[0].guess.bearing}
              color={playerColor}
              extraNeedles={isMultiplayer ? revealNeedles : []}
              live={config.liveCompass}
              size={compassSizeFor(width)}
              truthBearing={record.results[0].score.trueBearing}
            />
          ) : (
            <>
              <Compass
                bearing={bearing}
                color={playerColor}
                extraNeedles={answeredNeedles}
                live={config.liveCompass}
                onChange={onSetBearing}
                size={compassSizeFor(width)}
              />
              <Text style={styles.readout}>{formatBearing(bearing, t.cardinals)}</Text>
            </>
          )}
          {legendItems.length > 0 && <Legend items={legendItems} />}
        </View>

        <Card style={styles.earthCard}>
          <View style={styles.earthCenter}>
            <EarthSection
              key={roundNumber}
              marks={earthMarks}
              showStraightLine={straightLine}
              size={earthSizeFor(width)}
              zoomControls={record !== undefined}
            />
          </View>
          {!record &&
            (straightLine ? (
              <InclinationSlider distanceKm={distanceKm} maxKm={maxDistanceKm} onChange={onSetDistanceKm} />
            ) : (
              <DistanceSlider maxKm={maxDistanceKm} onChange={onSetDistanceKm} valueKm={distanceKm} />
            ))}
        </Card>

        {record && <RoundResult options={config} players={players} record={record} totals={totals} />}
      </Screen>

      {isMultiplayer && !record && <TurnPopup key={roundNumber} name={currentPlayerName} />}
    </>
  );
};
