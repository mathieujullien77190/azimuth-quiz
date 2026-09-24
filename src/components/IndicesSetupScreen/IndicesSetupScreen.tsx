import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  DIFFICULTIES,
  INDICES_ANSWER_METHODS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_PLACEHOLDERS,
  PLAYER_COLORS,
  ROUND_OPTIONS,
  fontSize,
  spacing,
} from '@/constants';
import { initials, shuffle } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useIndicesSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Screen from '../ui/Screen';
import Section from '../ui/Section';
import { resizeNames } from './helpers';
import type { IndicesSetupScreenProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    names: {
      gap: spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    nameDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    inputWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    input: {
      ...typography.heading,
      minHeight: 44,
      paddingLeft: spacing.md,
      paddingRight: 46,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    initialsBadge: {
      position: 'absolute',
      right: spacing.xs + 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    initialsText: {
      ...typography.label,
      fontSize: fontSize.caption,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
  });

export const IndicesSetupScreen = ({ onStart, onBack }: IndicesSetupScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { settings, updateSettings } = useIndicesSettings();
  const playerCount = settings.playerNames.length;
  const placeholderNames = useMemo(() => shuffle([...NAME_PLACEHOLDERS]), []);

  return (
    <Screen>
      <Text style={styles.title}>{t.indicesSetup.screenTitle}</Text>

      <Section hint={t.indicesSetup.playersSection.hint} title={t.indicesSetup.playersSection.title}>
        <View style={styles.chips}>
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((count) => (
            <Chip
              key={count}
              label={String(count)}
              onPress={() => updateSettings({ playerNames: resizeNames(settings.playerNames, count) })}
              selected={playerCount === count}
            />
          ))}
        </View>
        <View style={styles.names}>
          {settings.playerNames.map((name, index) => {
            const placeholder = placeholderNames[index % placeholderNames.length];

            return (
              <View key={index} style={styles.nameRow}>
                <View style={[styles.nameDot, { backgroundColor: PLAYER_COLORS[index] }]} />
                <View style={styles.inputWrap}>
                  <TextInput
                    accessibilityLabel={t.indicesSetup.playerNameAccessibility(index + 1)}
                    maxLength={10}
                    onChangeText={(text) =>
                      updateSettings({
                        playerNames: settings.playerNames.map((current, i) => (i === index ? text : current)),
                      })
                    }
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    value={name}
                  />
                  <View style={[styles.initialsBadge, { borderColor: PLAYER_COLORS[index] }]}>
                    <Text style={[styles.initialsText, { color: PLAYER_COLORS[index] }]}>
                      {initials(name.trim() || placeholder)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Section>

      <Section hint={t.indicesSetup.difficultyHint} title={t.indicesSetup.difficultyTitle}>
        <View style={styles.chips}>
          {DIFFICULTIES.map((difficulty) => (
            <Chip
              key={difficulty.id}
              emoji={difficulty.emoji}
              label={t.setup.difficulties[difficulty.id]}
              onPress={() => updateSettings({ difficulty: difficulty.id })}
              selected={settings.difficulty === difficulty.id}
            />
          ))}
        </View>
      </Section>

      <Section title={t.indicesSetup.answerMethodTitle}>
        <View style={styles.chips}>
          {INDICES_ANSWER_METHODS.map((method) => (
            <Chip
              key={method.id}
              label={t.indicesSetup.answerMethods[method.id]}
              onPress={() => updateSettings({ answerMethod: method.id })}
              selected={settings.answerMethod === method.id}
            />
          ))}
        </View>
      </Section>

      <Section title={t.setup.roundsTitle}>
        <View style={styles.chips}>
          {ROUND_OPTIONS.map((rounds) => (
            <Chip
              key={rounds}
              label={String(rounds)}
              onPress={() => updateSettings({ rounds })}
              selected={settings.rounds === rounds}
            />
          ))}
        </View>
      </Section>

      <Button label={t.indicesSetup.start} onPress={onStart} />
      <Button label={t.indicesSetup.back} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
