import { memo } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { initials } from '@/helpers';
import { useThemedStyles } from '@/themes';

import { COMPACT_BREAKPOINT } from './constants';
import type { PlayerTabsProps } from './types';

import { createStyles } from './styles';

/** Who's playing, fixed at the top of an online game screen — purely informational: status only
 * (whose turn it is), nothing to tap. */
export const PlayerTabs = memo(function PlayerTabs({ players, order, activeIndex, activeLabel }: PlayerTabsProps) {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  return (
    <ScrollView
      contentContainerStyle={[styles.row, compact && styles.rowCompact]}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {order.map((index) => {
        const player = players[index];
        const isActive = index === activeIndex;

        return (
          <View key={player.name + index} style={[styles.tab, compact && styles.tabCompact, isActive && styles.active]}>
            <View style={[styles.dot, compact && styles.dotCompact, { backgroundColor: player.color }]} />
            <Text style={[styles.label, compact && styles.labelCompact, isActive && styles.labelActive]}>
              {isActive && activeLabel ? activeLabel(player.name) : initials(player.name)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
});
