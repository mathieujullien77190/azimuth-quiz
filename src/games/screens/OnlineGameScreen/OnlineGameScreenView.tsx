import { Text, View, useWindowDimensions } from 'react-native';
import { formatBearing, formatDistance, kmToRatio, ratioToKm } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Compass from '@/components/geo/Compass';
import EarthSection from '@/components/geo/EarthSection';
import FooterNav from '../../components/FooterNav';
import GameFooter from '@/components/game/GameFooter';
import ReactionOverlay from '@/components/game/ReactionOverlay';
import GameHeader from '@/components/game/GameHeader';
import { compassSizeFor, distanceSliderMarks, earthSizeFor } from './helpers';
import PlaceCard from '../../components/PlaceCard';
import RoundResult from '../../components/RoundResult';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import SliderTrack from '@/components/ui/SliderTrack';
import type { OnlineGameScreenViewProps } from './types';

import { createStyles } from './OnlineGameScreenView.styles';

/**
 * Un seul `Screen`/`ScrollView` pour la phase reponse et la phase envoye/reveal (voir le type des props).
 * Rendu pur.
 */
export const OnlineGameScreenView = ({
  scrollRef,
  onQuit,
  name,
  points,
  roomCode,
  difficulty,
  roundNumber,
  totalRounds,
  place,
  showCountry,
  compassColor,
  liveCompass,
  bearing,
  onSetBearing,
  earthMarks,
  origin,
  location,
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
  reaction,
  onReact,
}: OnlineGameScreenViewProps) => {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  // Rien a montrer a un non-hote une fois la manche confirmee : il attend le "manche suivante" de l'hote.
  const footerContent = record ? (
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
  );

  return (
    <Screen
      footer={(footerContent || onReact) && <GameFooter onReact={onReact}>{footerContent}</GameFooter>}
      overlay={<ReactionOverlay reaction={reaction ?? null} />}
      header={
        <GameHeader
          code={roomCode}
          difficulty={difficulty}
          location={location}
          name={name}
          onQuit={onQuit}
          points={points}
          roundNumber={roundNumber}
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
          {/* Globe 3D pour la solution seulement : pas d'`origin` ni de bascule pendant les reponses. */}
          <EarthSection
            marks={earthMarks}
            origin={record === undefined ? undefined : origin}
            size={earthSizeFor(width)}
            zoomControls={record !== undefined}
          />
        </View>
        {!record && (
          <SliderTrack
            label={t.sliders.distance}
            marks={distanceSliderMarks(maxDistanceKm)}
            onRatioChange={(ratio) => onSetDistanceKm(ratioToKm(ratio, maxDistanceKm))}
            ratio={kmToRatio(distanceKm, maxDistanceKm)}
            valueText={formatDistance(distanceKm)}
          />
        )}
      </Card>

      {/* Toujours en bas, en attente ou confirme : sinon la mise en page saute au passage a la solution. */}
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
