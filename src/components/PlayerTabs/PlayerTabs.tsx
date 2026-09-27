import { memo } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { initials } from '@/helpers';
import { useThemedStyles } from '@/themes';

import { CHECK_MARK, COMPACT_BREAKPOINT } from './constants';
import { isTabLocked } from './helpers';
import type { PlayerTabsProps } from './types';

import { createStyles } from './styles';

/** Player selector fixed at the top of the game screen: pick who's answering, without leaving the screen. */
export const PlayerTabs = memo(function PlayerTabs({
  players,
  order,
  activeIndex,
  answered,
  allowRevision,
  onSelect,
  activeLabel,
}: PlayerTabsProps) {
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
        const isAnswered = answered[index] === true;
        const locked = onSelect !== undefined && isTabLocked(isActive, isAnswered, allowRevision ?? false);

        const content = (
          <>
            <View style={[styles.dot, compact && styles.dotCompact, { backgroundColor: player.color }]} />
            <Text style={[styles.label, compact && styles.labelCompact, isActive && styles.labelActive]}>
              {isActive && activeLabel ? activeLabel(player.name) : initials(player.name)}
            </Text>
            {isAnswered && (
              <Text style={[styles.check, compact && styles.checkCompact, isActive && styles.checkActive]}>
                {CHECK_MARK}
              </Text>
            )}
          </>
        );

        // No `onSelect`: purely informational, a plain (non-pressable) tab — see this prop's own
        // doc comment.
        if (onSelect === undefined) {
          return (
            <View
              key={player.name + index}
              style={[styles.tab, compact && styles.tabCompact, isActive && styles.active]}
            >
              {content}
            </View>
          );
        }

        return (
          <Pressable
            key={player.name + index}
            accessibilityLabel={player.name}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: locked }}
            disabled={locked}
            onPress={() => onSelect(index)}
            style={[styles.tab, compact && styles.tabCompact, isActive && styles.active, locked && styles.locked]}
          >
            {content}
          </Pressable>
        );
      })}
    </ScrollView>
  );
});
