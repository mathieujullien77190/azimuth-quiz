import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import { CHECK_MARK } from './constants';
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
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body - 1,
    },
    labelActive: {
      color: colors.onAccent,
    },
    check: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.body - 1,
    },
    checkActive: {
      color: colors.onAccent,
    },
  });

/** Selecteur de joueur fixe en haut de l'ecran de jeu : on choisit qui repond, sans quitter l'ecran. */
export const PlayerTabs = ({ players, order, activeIndex, answered, allowRevision, onSelect }: PlayerTabsProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      contentContainerStyle={styles.row}
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
            style={[styles.tab, isActive && styles.active, locked && styles.locked]}
          >
            <View style={[styles.dot, { backgroundColor: player.color }]} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{player.name}</Text>
            {isAnswered && <Text style={[styles.check, isActive && styles.checkActive]}>{CHECK_MARK}</Text>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
