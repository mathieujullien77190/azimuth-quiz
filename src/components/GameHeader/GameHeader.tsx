import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import RoundProgress from '@/components/RoundProgress';
import type { GameHeaderProps } from './types';

import { createStyles } from './styles';

/**
 * Quit + score + round progress: the in-round header shared by every game — dumb, `t.game.quit`
 * is already the same key across all three games' translations. `children` slots in whatever
 * goes below the round dots (Compass' `PlayerTabs`, Silhouette's guess prompt...).
 */
export const GameHeader = ({ onQuit, scoreLabel, roundNumber, totalRounds, difficulties, children }: GameHeaderProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
          <Text style={styles.quit}>{t.game.quit}</Text>
        </Pressable>
        {scoreLabel !== undefined && <Text style={styles.score}>{scoreLabel}</Text>}
      </View>
      <RoundProgress difficulties={difficulties} roundNumber={roundNumber} totalRounds={totalRounds} />
      {children}
    </View>
  );
};
