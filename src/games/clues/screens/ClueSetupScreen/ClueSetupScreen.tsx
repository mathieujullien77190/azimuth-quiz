import { useEffect, useMemo } from 'react';
import { Text, TextInput, View } from 'react-native';

import {
  DIFFICULTIES,
  CLUE_PLACES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_PLACEHOLDERS,
  PLAYER_COLORS,
  ROUND_OPTIONS,
  difficultyEmoji,
  isCapitalPlace,
  isFrenchCityPlace,
} from '@/data';
import { initials } from '@/helpers';
import { CLUE_ANSWER_METHODS, CLUE_CATEGORIES } from '@/games/clues/constants';
import { loadClueHistory } from '@/games/clues/helpers/clueHistory';
import { effectiveDifficulty } from '@/games/compass/helpers/places';
import { useLanguage, useTranslation } from '@/i18n';
import { useClueSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { ClueCategory } from '@/types';

import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import Toggle from '@/components/ui/Toggle';
import { resizeNames } from './helpers';
import type { ClueSetupScreenProps } from './types';

import { createStyles } from './styles';

export const ClueSetupScreen = ({ onStart, onBack }: ClueSetupScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const t = useTranslation();
  const { settings, updateSettings } = useClueSettings();
  const { language } = useLanguage();
  const playerCount = settings.playerNames.length;
  // Fixed order (same name always at the same field) rather than randomized per load.
  const placeholderNames = NAME_PLACEHOLDERS;
  const available = useMemo(
    () =>
      CLUE_PLACES.filter((place) => {
        const category = isCapitalPlace(place) ? 'capital' : isFrenchCityPlace(place) ? 'citiesFr' : 'cities';
        return settings.categories.includes(category) && effectiveDifficulty(place, language) === settings.difficulty;
      }).length,
    [settings.categories, settings.difficulty, language],
  );

  // Fire-and-forget: by the time the player presses "Start", the read is essentially always
  // done, so the very first round already benefits from the draw history (see
  // helpers/clueHistory.ts) instead of only rounds 2+ within this session.
  useEffect(() => {
    loadClueHistory();
  }, []);

  const toggleCategory = (category: ClueCategory) => {
    const categories = settings.categories.includes(category)
      ? settings.categories.filter((c) => c !== category)
      : [...settings.categories, category];
    updateSettings({ categories });
  };

  return (
    <Screen>
      <Text style={styles.title}>{t.cluesSetup.screenTitle}</Text>

      <Section hint={t.cluesSetup.playersSection.hint} title={t.cluesSetup.playersSection.title}>
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
                    accessibilityLabel={t.cluesSetup.playerNameAccessibility(index + 1)}
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

      <Section hint={t.setup.categoriesAvailability(available)} title={t.setup.categoriesTitle}>
        <View style={styles.chips}>
          {CLUE_CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              emoji={category.emoji}
              label={t.setup.categories[category.id]}
              onPress={() => toggleCategory(category.id)}
              selected={settings.categories.includes(category.id)}
            />
          ))}
        </View>
      </Section>

      <Section hint={t.cluesSetup.difficultyHint} title={t.cluesSetup.difficultyTitle}>
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

      <Section title={t.cluesSetup.answerMethodTitle}>
        <View style={styles.chips}>
          {CLUE_ANSWER_METHODS.map((method) => (
            <Chip
              key={method.id}
              label={t.cluesSetup.answerMethods[method.id]}
              onPress={() => updateSettings({ answerMethod: method.id })}
              selected={settings.answerMethod === method.id}
            />
          ))}
        </View>
      </Section>

      <Section title={t.cluesSetup.optionsTitle}>
        <Toggle
          {...t.cluesSetup.toggles.startWithFirstLetter}
          onValueChange={(value) => updateSettings({ startWithFirstLetter: value })}
          value={settings.startWithFirstLetter}
        />
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

      <Button label={t.cluesSetup.start} onPress={onStart} />
      <Button label={t.cluesSetup.back} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
