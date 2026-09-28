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
import PlaceCard from '../../components/PlaceCard';
import RoundResult from '../../components/RoundResult';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import type { OnlineGameScreenViewProps } from './types';

import { createStyles } from './OnlineGameScreenView.styles';

/**
 * One `Screen`/`ScrollView` for both the answer phase and the submitted-or-revealed phase — see
 * this prop type's own comment for why they're no longer two separate components. Pure rendering,
 * no hooks with side effects.
 */
export const OnlineGameScreenView = ({
  scrollRef,
  onQuit,
  headerScore,
  roomCode,
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
  distanceKm,
  onSetDistanceKm,
  maxDistanceKm,
  onCap,
  onScroll,
  onGoToCap,
  onGoToDistance,
  onSubmit,
  submitDisabled,
  extraNeedles,
  truthBearing,
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
}: OnlineGameScreenViewProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen
      footer={
        record ? (
          confirmed ? (
            isHost && <Button label={isLastRound ? t.game.last : t.game.next} onPress={onNextRound ?? (() => {})} />
          ) : (
            <Text style={styles.waiting}>{t.game.waitingForOthers}</Text>
          )
        ) : (
          <FooterNav
            onCap={onCap}
            onGoToCap={onGoToCap}
            onGoToDistance={onGoToDistance}
            onValidate={onSubmit}
            validateDisabled={submitDisabled}
          />
        )
      }
      header={
        <GameHeader
          difficulties={difficulties}
          onQuit={onQuit}
          roomCode={roomCode}
          roundNumber={roundNumber}
          scoreLabel={headerScore}
          totalRounds={totalRounds}
        />
      }
      onScroll={record ? undefined : onScroll}
      scrollRef={scrollRef}
    >
      <PlaceCard
        description={record ? place.description : undefined}
        place={place}
        showCountry={record ? true : showCountry}
      />

      <View style={styles.compass}>
        {record ? (
          <Compass
            live={liveCompass}
            needles={extraNeedles ?? []}
            size={compassSizeFor(width)}
            truthBearing={truthBearing}
          />
        ) : (
          <>
            <Compass
              live={liveCompass}
              needles={[{ bearing, color: compassColor }]}
              onChange={onSetBearing}
              size={compassSizeFor(width)}
            />
            <Text style={styles.readout}>{formatBearing(bearing, t.cardinals)}</Text>
          </>
        )}
      </View>

      <Card style={styles.earthCard}>
        <View style={styles.earthCenter}>
          <EarthSection marks={earthMarks} size={earthSizeFor(width)} zoomControls={record !== undefined} />
        </View>
        {!record && <DistanceSlider maxKm={maxDistanceKm} onChange={onSetDistanceKm} valueKm={distanceKm} />}
      </Card>

      {/* Always here, at the bottom, whether pending or confirmed — never above the compass/Earth,
          so the layout doesn't jump around as the round goes from waiting to revealed. */}
      {record && players !== undefined && totals !== undefined && localIndex !== undefined && (
        <RoundResult
          answered={answered}
          localIndex={localIndex}
          onKick={onKick}
          players={players}
          record={record}
          totals={totals}
        />
      )}
    </Screen>
  );
};
