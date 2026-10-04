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

/**
 * The grid of clue cards, plus the hidden "vowels" card once unlocked — rendered from the room's
 * shared state (`revealedClueIds`) with the per-clue stage-counting logic kept out of the screen. Dumb: everything it needs is already resolved by the caller.
 */
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
  // What this particular place actually offers: `CLUE_ORDER` minus whatever doesn't apply to it
  // (a `citiesFr` place drops a handful of clues that never vary for a French city, and any place
  // drops `personality` when none was curated for it — see `cluesFor`).
  const availableClueIds = cluesFor(place);
  // Unlike every other card, `vowels` only ever renders once genuinely unlocked (all other clues
  // picked at least once) — never just because the round is over (a round that ended early via
  // "give up" never shows it, even in reveal).
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
