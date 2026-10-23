import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import ClueCard from '../ClueCard';
import Card from '@/components/ui/Card';
import { cluesFor } from '@/games/clues/helpers/clueGame';
import { clueHasMoreToReveal, clueStage, vowelsUnlocked } from './helpers';
import type { ClueGridProps } from './types';

import { createStyles } from './styles';

const MAX_FLAG_STAGE = 3;

/** Grille des cartes d'indices, plus la carte "voyelles" une fois debloquee. Dumb : tout est deja resolu par l'appelant. */
export const ClueGrid = ({
  place,
  bearingDeg,
  distanceKm,
  origin,
  revealedClueIds,
  roundOver,
  onPickClue,
}: ClueGridProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  // Ce que ce lieu offre vraiment (voir `cluesFor`).
  const availableClueIds = cluesFor(place);
  // `vowels` n'apparait que si elle est vraiment debloquee, jamais juste parce que la manche est finie (meme apres "je ne sais pas").
  const showVowels = vowelsUnlocked(revealedClueIds, availableClueIds);

  return (
    <Card>
      <View style={styles.clueGrid}>
        {availableClueIds.map((clueId) => {
          const revealed = roundOver || revealedClueIds.includes(clueId);
          const isEmoji = clueId === 'emoji';
          const isFlag = clueId === 'flagColors';
          const isDistance = clueId === 'distance';
          const isGlobe = clueId === 'globe';
          const isElevation = clueId === 'elevation';
          const isPopulation = clueId === 'population';
          const isCurrency = clueId === 'currency';
          const isLocalTime = clueId === 'localTime';
          const isLetter = clueId === 'letter';
          const stage = clueStage(revealedClueIds, clueId);
          const moreToReveal = !roundOver && clueHasMoreToReveal(revealedClueIds, clueId);
          return (
            <ClueCard
              bearingDeg={bearingDeg}
              clueId={clueId}
              currencyStage={isCurrency ? (roundOver ? 2 : stage) : undefined}
              distanceKm={distanceKm}
              distanceStage={isDistance ? (roundOver ? 2 : stage) : undefined}
              elevationStage={isElevation ? (roundOver ? 2 : stage) : undefined}
              emojiStage={isEmoji ? (roundOver ? 3 : stage) : undefined}
              globeStage={isGlobe ? (roundOver ? 2 : stage) : undefined}
              flagStage={isFlag ? (roundOver ? MAX_FLAG_STAGE : stage) : undefined}
              key={clueId}
              label={t.cluesGame.clues[clueId]}
              letterStage={isLetter ? (roundOver ? 2 : stage) : undefined}
              localTimeStage={isLocalTime ? (roundOver ? 2 : stage) : undefined}
              moreToReveal={moreToReveal}
              populationStage={isPopulation ? (roundOver ? 2 : stage) : undefined}
              origin={origin}
              onPress={onPickClue === undefined ? undefined : () => onPickClue(clueId)}
              place={place}
              state={revealed ? 'revealed' : 'locked'}
            />
          );
        })}
        {showVowels && (
          <ClueCard
            clueId="vowels"
            key="vowels"
            label={t.cluesGame.clues.vowels}
            moreToReveal={false}
            onPress={onPickClue === undefined ? undefined : () => onPickClue('vowels')}
            place={place}
            state={roundOver || revealedClueIds.includes('vowels') ? 'revealed' : 'locked'}
          />
        )}
      </View>
    </Card>
  );
};
