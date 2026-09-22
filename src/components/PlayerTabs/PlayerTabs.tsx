import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { initials } from '@/helpers';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import { CHECK_MARK, COMPACT_BREAKPOINT } from './constants';
import { isTabLocked } from './helpers';
import type { PlayerTabsProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Sans ca, le ScrollView horizontal s'etire pour remplir la hauteur restante du Screen.
    scroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm + 2,
    },
    rowCompact: {
      gap: spacing.xs + 1,
      paddingHorizontal: spacing.sm,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    tabCompact: {
      gap: spacing.xs,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: spacing.xs + 1,
    },
    active: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    locked: {
      opacity: 0.5,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotCompact: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body - 1,
    },
    labelCompact: {
      fontSize: fontSize.caption + 1,
    },
    labelActive: {
      color: colors.onAccent,
    },
    check: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.body - 1,
    },
    checkCompact: {
      fontSize: fontSize.caption + 1,
    },
    checkActive: {
      color: colors.onAccent,
    },
  });

/** Selecteur de joueur fixe en haut de l'ecran de jeu : on choisit qui repond, sans quitter l'ecran. */
export const PlayerTabs = ({ players, order, activeIndex, answered, allowRevision, onSelect }: PlayerTabsProps) => {
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
        const locked = isTabLocked(isActive, isAnswered, allowRevision);

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
            <View style={[styles.dot, compact && styles.dotCompact, { backgroundColor: player.color }]} />
            <Text style={[styles.label, compact && styles.labelCompact, isActive && styles.labelActive]}>
              {initials(player.name)}
            </Text>
            {isAnswered && (
              <Text style={[styles.check, compact && styles.checkCompact, isActive && styles.checkActive]}>
                {CHECK_MARK}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
