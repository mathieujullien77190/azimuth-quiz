import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CATEGORIES,
  DIFFICULTIES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_PLACEHOLDERS,
  PLAYER_COLORS,
  ROUND_OPTIONS,
  ZONES,
  fontSize,
  spacing,
} from '@/constants';
import { filterPlaces, initials, shuffle } from '@/helpers';
import { useSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Screen from '../ui/Screen';
import Section from '../ui/Section';
import Toggle from '../ui/Toggle';
import { BACK_LABEL, DISTANCE_MODES, SCREEN_TITLE, START_LABEL, TOGGLES } from './constants';
import { availabilityLabel, resizeNames, toggleSelected } from './helpers';
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
    // Conteneur de l'input : positionne les initiales en son sein, jamais comme voisin qui peut
    // pousser la ligne hors de l'ecran.
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
    initials: {
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
  const playerCount = settings.playerNames.length;
  const available = filterPlaces(settings.categories, settings.difficulties, settings.zone).length;
  const zone = ZONES.find((candidate) => candidate.id === settings.zone);
  // Un ordre different a chaque arrivee sur l'ecran, stable pendant qu'on tape.
  const placeholderNames = useMemo(() => shuffle([...NAME_PLACEHOLDERS]), []);

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
        <View style={styles.names}>
          {settings.playerNames.map((name, index) => {
            const placeholder = placeholderNames[index % placeholderNames.length];

            return (
              <View key={index} style={styles.nameRow}>
                <View style={[styles.nameDot, { backgroundColor: PLAYER_COLORS[index] }]} />
                <View style={styles.inputWrap}>
                  <TextInput
                    accessibilityLabel={`Nom du joueur ${index + 1}`}
                    maxLength={14}
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
                  <View style={[styles.initials, { borderColor: PLAYER_COLORS[index] }]}>
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

      <Section title="Catégories">
        <View style={styles.chips}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              emoji={category.emoji}
              label={category.label}
              onPress={() => updateSettings({ categories: toggleSelected(settings.categories, category.id) })}
              selected={settings.categories.includes(category.id)}
            />
          ))}
        </View>
      </Section>

      <Section title="Difficulté" hint="Notoriété du lieu : plus c'est pointu, plus c'est dur.">
        <View style={styles.chips}>
          {DIFFICULTIES.map((difficulty) => (
            <Chip
              key={difficulty.id}
              emoji={difficulty.emoji}
              label={difficulty.label}
              onPress={() => updateSettings({ difficulties: toggleSelected(settings.difficulties, difficulty.id) })}
              selected={settings.difficulties.includes(difficulty.id)}
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

      <Section title="Distance">
        <View style={styles.chips}>
          {DISTANCE_MODES.map((mode) => (
            <Chip
              key={mode.id}
              label={mode.label}
              onPress={() => updateSettings({ straightLine: mode.straightLine })}
              selected={settings.straightLine === mode.straightLine}
            />
          ))}
        </View>
        <Text style={styles.hint}>
          {DISTANCE_MODES.find((mode) => mode.straightLine === settings.straightLine)?.description}
        </Text>
      </Section>

      <Section title="Options">
        <Toggle
          {...TOGGLES.liveCompass}
          onValueChange={(value) => updateSettings({ liveCompass: value })}
          value={settings.liveCompass}
        />
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
        {settings.playerNames.length > 1 && (
          <Toggle
            {...TOGGLES.allowRevision}
            onValueChange={(value) => updateSettings({ allowRevision: value })}
            value={settings.allowRevision}
          />
        )}
      </Section>

      <Text style={styles.availability}>{availabilityLabel(available, settings.rounds)}</Text>
      <Button disabled={available === 0} label={START_LABEL} onPress={onStart} />
      <Button label={BACK_LABEL} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
