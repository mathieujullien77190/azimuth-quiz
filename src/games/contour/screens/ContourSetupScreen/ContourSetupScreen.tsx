import { Text, TextInput, View } from 'react-native';

import {
  DIFFICULTIES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_PLACEHOLDERS,
  PLAYER_COLORS,
  ROUND_OPTIONS,
  difficultyEmoji,
} from '@/data';
import { initials } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useContourSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import { resizeNames } from './helpers';
import type { ContourSetupScreenProps } from './types';

import { createStyles } from './styles';

export const ContourSetupScreen = ({ onStart, onBack }: ContourSetupScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const t = useTranslation();
  const { settings, updateSettings } = useContourSettings();
  const playerCount = settings.playerNames.length;
  // Fixed order (same name always at the same field) rather than randomized per load.
  const placeholderNames = NAME_PLACEHOLDERS;

  return (
    <Screen>
      <Text style={styles.title}>{t.contourSetup.screenTitle}</Text>

      <Section hint={t.contourSetup.playersSection.hint} title={t.contourSetup.playersSection.title}>
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
                    accessibilityLabel={t.contourSetup.playerNameAccessibility(index + 1)}
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

      <Section hint={t.contourSetup.difficultyHint} title={t.contourSetup.difficultyTitle}>
        <View style={styles.chips}>
          {DIFFICULTIES.map((difficulty) => (
            <Chip
              key={difficulty.id}
              emoji={difficultyEmoji(difficulty, isDark)}
              label={t.setup.difficulties[difficulty.id]}
              onPress={() => updateSettings({ difficulty: difficulty.id })}
              selected={settings.difficulty === difficulty.id}
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

      <Button label={t.contourSetup.start} onPress={onStart} />
      <Button label={t.contourSetup.back} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
