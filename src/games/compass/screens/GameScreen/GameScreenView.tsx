import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { formatBearing } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Compass from '@/components/Compass';
import DistanceSlider from '../../components/DistanceSlider';
import EarthSection from '@/components/EarthSection';
import FooterNav from '../../components/FooterNav';
import GameHeader from '@/components/GameHeader';
import InclinationSlider from '../../components/InclinationSlider';
import Legend from '../../components/Legend';
import PlaceCard from '../../components/PlaceCard';
import PlayerTabs from '@/components/PlayerTabs';
import RoundResult from '../../components/RoundResult';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import { compassSizeFor, earthSizeFor } from './helpers';
import type { GameScreenViewProps } from './types';

import { createStyles } from './GameScreenView.styles';

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
  onCap,
  onScroll,
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
              onCap={onCap}
              onGoToCap={onGoToCap}
              onGoToDistance={onGoToDistance}
              onValidate={onSubmit}
              validateDisabled={validateDisabled}
            />
          )
        }
        onScroll={record ? undefined : onScroll}
        scrollRef={scrollRef}
        header={
          <GameHeader
            difficulties={config.difficulties}
            onQuit={onQuit}
            roundNumber={roundNumber}
            scoreLabel={scoreLabel}
            totalRounds={totalRounds}
          >
            {isMultiplayer && !record && (
              <PlayerTabs
                activeIndex={activePlayerIndex}
                activeLabel={t.game.playerTurn}
                answered={answeredByPlayer}
                order={roundOrder}
                players={players}
              />
            )}
          </GameHeader>
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
