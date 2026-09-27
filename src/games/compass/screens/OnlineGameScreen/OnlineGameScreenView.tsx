import { Text, View, useWindowDimensions } from 'react-native';
import { formatBearing } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Compass from '@/components/Compass';
import DistanceSlider from '../../components/DistanceSlider';
import EarthSection from '@/components/EarthSection';
import FooterNav from '../../components/FooterNav';
import GameHeader from '@/components/GameHeader';
import { compassSizeFor, earthSizeFor } from '../GameScreen/helpers';
import InclinationSlider from '../../components/InclinationSlider';
import PlaceCard from '../../components/PlaceCard';
import RoundResult from '../../components/RoundResult';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import type { OnlineAnswerViewProps, OnlineResultsViewProps } from './types';

import { createStyles } from './OnlineGameScreenView.styles';

/**
 * `gameState.screen === 'game'`, not yet submitted — the only phase with an editable
 * compass/slider. Pure rendering, no hooks with side effects.
 */
export const OnlineAnswerView = ({
  scrollRef,
  onQuit,
  headerScore,
  difficulties,
  roundNumber,
  totalRounds,
  place,
  showCountry,
  compassColor,
  liveCompass,
  bearing,
  onSetBearing,
  earthMarks,
  straightLine,
  distanceKm,
  onSetDistanceKm,
  maxDistanceKm,
  onCap,
  onScroll,
  onGoToCap,
  onGoToDistance,
  onSubmit,
  submitDisabled,
}: OnlineAnswerViewProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen
      footer={
        <FooterNav
          onCap={onCap}
          onGoToCap={onGoToCap}
          onGoToDistance={onGoToDistance}
          onValidate={onSubmit}
          validateDisabled={submitDisabled}
        />
      }
      header={
        <GameHeader
          difficulties={difficulties}
          onQuit={onQuit}
          roundNumber={roundNumber}
          scoreLabel={headerScore}
          totalRounds={totalRounds}
        />
      }
      onScroll={onScroll}
      scrollRef={scrollRef}
    >
      <PlaceCard place={place} showCountry={showCountry} />

      <View style={styles.compass}>
        <Compass
          bearing={bearing}
          color={compassColor}
          live={liveCompass}
          onChange={onSetBearing}
          size={compassSizeFor(width)}
        />
        <Text style={styles.readout}>{formatBearing(bearing, t.cardinals)}</Text>
      </View>

      <Card style={styles.earthCard}>
        <View style={styles.earthCenter}>
          <EarthSection
            marks={earthMarks}
            showStraightLine={straightLine}
            size={earthSizeFor(width)}
            zoomControls={false}
          />
        </View>
        {straightLine ? (
          <InclinationSlider distanceKm={distanceKm} maxKm={maxDistanceKm} onChange={onSetDistanceKm} />
        ) : (
          <DistanceSlider maxKm={maxDistanceKm} onChange={onSetDistanceKm} valueKm={distanceKm} />
        )}
      </Card>
    </Screen>
  );
};

/**
 * Submitted-and-waiting or officially revealed — same layout either way (see `RoundResult`'s own
 * `pending` mode), just fed live/partial data until `confirmed`. Pure rendering.
 */
export const OnlineResultsView = ({
  onQuit,
  headerScore,
  difficulties,
  roundNumber,
  totalRounds,
  place,
  compassColor,
  extraNeedles,
  liveCompass,
  truthBearing,
  earthMarks,
  straightLine,
  answered,
  localIndex,
  onKick,
  players,
  record,
  totals,
  confirmed,
  isHost,
  isLastRound,
  onNextRound,
}: OnlineResultsViewProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen
      footer={
        confirmed ? (
          isHost && <Button label={isLastRound ? t.game.last : t.game.next} onPress={onNextRound} />
        ) : (
          <Text style={styles.waiting}>{t.game.waitingForOthers}</Text>
        )
      }
      header={
        <GameHeader
          difficulties={difficulties}
          onQuit={onQuit}
          roundNumber={roundNumber}
          scoreLabel={headerScore}
          totalRounds={totalRounds}
        />
      }
    >
      <PlaceCard description={place.description} place={place} showCountry />

      <View style={styles.compass}>
        <Compass
          bearing={null}
          color={compassColor}
          extraNeedles={extraNeedles}
          live={liveCompass}
          size={compassSizeFor(width)}
          truthBearing={truthBearing}
        />
      </View>

      <Card style={styles.earthCard}>
        <View style={styles.earthCenter}>
          <EarthSection marks={earthMarks} showStraightLine={straightLine} size={earthSizeFor(width)} zoomControls />
        </View>
      </Card>

      {/* Always here, at the bottom, whether pending or confirmed — never above the compass/Earth,
          so the layout doesn't jump around as the round goes from waiting to revealed. */}
      <RoundResult
        answered={answered}
        localIndex={localIndex}
        onKick={onKick}
        options={{ straightLine }}
        players={players}
        record={record}
        totals={totals}
      />
    </Screen>
  );
};
