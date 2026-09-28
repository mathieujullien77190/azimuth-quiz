import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import ClueCard from '../ClueCard';
import Card from '@/components/ui/Card';
import { CLUE_ORDER } from '@/games/clues/constants';
import { clueHasMoreToReveal, clueStage, vowelsUnlocked } from './helpers';
import type { ClueGridProps } from './types';

import { createStyles } from './styles';

const MAX_FLAG_STAGE = 3;

/**
 * The grid of clue cards, plus the hidden "vowels" card once unlocked — extracted out of
 * `ClueGameScreen` so both the local game and the online one render exactly the same board from
 * the same shared state (`revealedClueIds`), rather than duplicating the per-clue stage-counting
 * logic. Dumb: everything it needs is already resolved by the caller.
 */
export const ClueGrid = ({ place, bearingDeg, distanceKm, revealedClueIds, roundOver, onPickClue }: ClueGridProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  // Unlike every other card, `vowels` only ever renders once genuinely unlocked (all other clues
  // picked at least once) — never just because the round is over (a round that ended early via
  // "give up" never shows it, even in reveal).
  const showVowels = vowelsUnlocked(revealedClueIds);

  return (
    <Card>
      <View style={styles.clueGrid}>
        {CLUE_ORDER.map((clueId) => {
          const revealed = roundOver || revealedClueIds.includes(clueId);
          const isEmoji = clueId === 'emoji';
          const isFlag = clueId === 'flagColors';
          const isDistance = clueId === 'distance';
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
              flagStage={isFlag ? (roundOver ? MAX_FLAG_STAGE : stage) : undefined}
              key={clueId}
              label={t.cluesGame.clues[clueId]}
              letterStage={isLetter ? (roundOver ? 2 : stage) : undefined}
              localTimeStage={isLocalTime ? (roundOver ? 2 : stage) : undefined}
              moreToReveal={moreToReveal}
              populationStage={isPopulation ? (roundOver ? 2 : stage) : undefined}
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
