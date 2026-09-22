import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CATEGORIES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_COLORS,
  ROUND_OPTIONS,
  THEME_MODES,
  ZONES,
  fontSize,
  spacing,
} from '@/constants';
import { filterPlaces } from '@/helpers';
import { useSettings } from '@/settings';
import { useTheme, useThemeSwitcher, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Screen from '../ui/Screen';
import Section from '../ui/Section';
import Toggle from '../ui/Toggle';
import { APPEARANCE_LABEL, BACK_LABEL, SCREEN_TITLE, START_LABEL, TOGGLES } from './constants';
import { availabilityLabel, resizeNames, toggleCategory } from './helpers';
import type { SetupScreenProps } from './types';

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
    input: {
      ...typography.heading,
      flex: 1,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    appearance: {
      gap: spacing.sm,
    },
    optionLabel: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    availability: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
  });

export const SetupScreen = ({ onStart, onBack }: SetupScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { mode, setMode } = useThemeSwitcher();
  const playerCount = settings.playerNames.length;
  const available = filterPlaces(settings.categories, settings.zone).length;
  const zone = ZONES.find((candidate) => candidate.id === settings.zone);

  return (
    <Screen>
      <Text style={styles.title}>{SCREEN_TITLE}</Text>

      <Section title="Joueurs" hint="Tout le monde joue sur le même téléphone, chacun son tour.">
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
        {playerCount > 1 && (
          <View style={styles.names}>
            {settings.playerNames.map((name, index) => (
              <View key={index} style={styles.nameRow}>
                <View style={[styles.nameDot, { backgroundColor: PLAYER_COLORS[index] }]} />
                <TextInput
                  accessibilityLabel={`Nom du joueur ${index + 1}`}
                  maxLength={14}
                  onChangeText={(text) =>
                    updateSettings({
                      playerNames: settings.playerNames.map((current, i) => (i === index ? text : current)),
                    })
                  }
                  placeholder={`Joueur ${index + 1}`}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={name}
                />
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Catégories">
        <View style={styles.chips}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              emoji={category.emoji}
              label={category.label}
              onPress={() => updateSettings({ categories: toggleCategory(settings.categories, category.id) })}
              selected={settings.categories.includes(category.id)}
            />
          ))}
        </View>
      </Section>

      <Section title="Zone">
        <View style={styles.chips}>
          {ZONES.map((candidate) => (
            <Chip
              key={candidate.id}
              label={candidate.label}
              onPress={() => updateSettings({ zone: candidate.id })}
              selected={settings.zone === candidate.id}
            />
          ))}
        </View>
        {zone !== undefined && <Text style={styles.hint}>{zone.description}</Text>}
      </Section>

      <Section title="Nombre de manches">
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

      <Section title="Options">
        <View style={styles.appearance}>
          <Text style={styles.optionLabel}>{APPEARANCE_LABEL}</Text>
          <View style={styles.chips}>
            {THEME_MODES.map((candidate) => (
              <Chip
                key={candidate.id}
                emoji={candidate.emoji}
                label={candidate.label}
                onPress={() => setMode(candidate.id)}
                selected={mode === candidate.id}
              />
            ))}
          </View>
        </View>
        <Toggle
          {...TOGGLES.straightLine}
          onValueChange={(value) => updateSettings({ straightLine: value })}
          value={settings.straightLine}
        />
        {Platform.OS !== 'web' && (
          <Toggle
            {...TOGGLES.liveCompass}
            onValueChange={(value) => updateSettings({ liveCompass: value })}
            value={settings.liveCompass}
          />
        )}
        <Toggle
          {...TOGGLES.useGps}
          onValueChange={(value) => updateSettings({ useGps: value })}
          value={settings.useGps}
        />
        <Toggle
          {...TOGGLES.showCountry}
          onValueChange={(value) => updateSettings({ showCountry: value })}
          value={settings.showCountry}
        />
      </Section>

      <Text style={styles.availability}>{availabilityLabel(available, settings.rounds)}</Text>
      <Button disabled={available === 0} label={START_LABEL} onPress={onStart} />
      <Button label={BACK_LABEL} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
