import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import type { ContourHintListProps } from './types';

import { createStyles } from './styles';

/**
 * The hints of a round, under the country, kept small: one card per group (the outline, the neighbors, the
 * cities) side by side, each with its title and how many of its steps are out, and ONE button — the next step of
 * the group, which the turn-holder taps to reveal it. A group with nothing left shows a tick instead. `disabled` (not this device's turn) only dims it: a tap still reaches the
 * caller, which can explain why nothing happens. The country
 * itself (`reveal`) is a card of its own, which the caller only lists once everything else is out. Dumb: what a pick does is up to
 * the caller.
 */
export const ContourHintList = ({ groups, disabled = false, onPick }: ContourHintListProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.list}>
      {groups.map(({ group, steps, next }) => {
        const out = steps.filter((entry) => entry.revealed).length;
        return (
          <View key={group} style={[styles.card, group === 'reveal' && styles.cardWide]}>
            <Text style={styles.title}>
              {t.contourGame.hintGroups[group]}
              {group === 'reveal' ? '' : ` ${out}/${steps.length}`}
            </Text>
            {next === undefined ? (
              <Text style={styles.done}>✓</Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                onPress={() => onPick(group)}
                style={[styles.step, disabled && styles.stepDisabled]}
              >
                <Text numberOfLines={1} style={styles.stepText}>
                  {t.contourGame.hintSteps[next]}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
};
