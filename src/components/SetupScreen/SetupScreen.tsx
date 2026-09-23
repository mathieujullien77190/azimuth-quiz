import { useMemo, useState } from 'react';
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
import { useTranslation } from '@/i18n';
import { useSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Screen from '../ui/Screen';
import Section from '../ui/Section';
import Toggle from '../ui/Toggle';
import { DISTANCE_MODES } from './constants';
import { resizeNames, selectDifficultyFilter, toggleCategoryFilter } from './helpers';
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
    coordRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    coordField: {
      flex: 1,
      gap: spacing.xs,
    },
    coordLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    coordInput: {
      ...typography.heading,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });

type CustomOriginInputsProps = {
  latitude: number;
  longitude: number;
  onChange: (patch: { customLatitude?: number; customLongitude?: number }) => void;
};

/**
 * Champs latitude/longitude controles localement (texte libre pendant la saisie, y compris "-"
 * ou "3." en cours de frappe) : ne pousse un nombre valide vers les reglages qu'une fois qu'il
 * parse vraiment, plutot que de faire sauter le champ a chaque caractere invalide.
 */
const CustomOriginInputs = ({ latitude, longitude, onChange }: CustomOriginInputsProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const [latText, setLatText] = useState(() => String(latitude));
  const [lonText, setLonText] = useState(() => String(longitude));

  const onLatChange = (text: string) => {
    setLatText(text);
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= -90 && value <= 90) onChange({ customLatitude: value });
  };
  const onLonChange = (text: string) => {
    setLonText(text);
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= -180 && value <= 180) onChange({ customLongitude: value });
  };

  return (
    <View style={styles.coordRow}>
      <View style={styles.coordField}>
        <Text style={styles.coordLabel}>{t.setup.customOrigin.latitude}</Text>
        <TextInput
          keyboardType="numbers-and-punctuation"
          onChangeText={onLatChange}
          placeholderTextColor={colors.textMuted}
          style={styles.coordInput}
          value={latText}
        />
      </View>
      <View style={styles.coordField}>
        <Text style={styles.coordLabel}>{t.setup.customOrigin.longitude}</Text>
        <TextInput
          keyboardType="numbers-and-punctuation"
          onChangeText={onLonChange}
          placeholderTextColor={colors.textMuted}
          style={styles.coordInput}
          value={lonText}
        />
      </View>
    </View>
  );
};

export const SetupScreen = ({ onStart, onBack }: SetupScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { settings, ready, updateSettings } = useSettings();
  const playerCount = settings.playerNames.length;
  const available = filterPlaces(settings.categories, settings.difficulties, settings.zone).length;
  const zoneDescription = t.setup.zones[settings.zone].description;
  // Un ordre different a chaque arrivee sur l'ecran, stable pendant qu'on tape.
  const placeholderNames = useMemo(() => shuffle([...NAME_PLACEHOLDERS]), []);

  return (
    <Screen>
      <Text style={styles.title}>{t.setup.screenTitle}</Text>

      <Section hint={t.setup.playersSection.hint} title={t.setup.playersSection.title}>
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
                    accessibilityLabel={t.setup.playerNameAccessibility(index + 1)}
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

      <Section title={t.setup.categoriesTitle}>
        <View style={styles.chips}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              emoji={category.emoji}
              label={t.setup.categories[category.id]}
              onPress={() => updateSettings(toggleCategoryFilter(settings, category.id))}
              selected={settings.categories.includes(category.id)}
            />
          ))}
        </View>
      </Section>

      <Section hint={t.setup.difficultyHint} title={t.setup.difficultyTitle}>
        <View style={styles.chips}>
          {DIFFICULTIES.map((difficulty) => (
            <Chip
              key={difficulty.id}
              emoji={difficulty.emoji}
              label={t.setup.difficulties[difficulty.id]}
              onPress={() => updateSettings(selectDifficultyFilter(settings, difficulty.id))}
              selected={settings.difficulties.includes(difficulty.id)}
            />
          ))}
        </View>
      </Section>

      <Section title={t.setup.zoneTitle}>
        <View style={styles.chips}>
          {ZONES.map((candidate) => (
            <Chip
              key={candidate.id}
              label={t.setup.zones[candidate.id].label}
              onPress={() => updateSettings({ zone: candidate.id })}
              selected={settings.zone === candidate.id}
            />
          ))}
        </View>
        <Text style={styles.hint}>{zoneDescription}</Text>
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

      <Section title={t.setup.modeTitle}>
        <View style={styles.chips}>
          {DISTANCE_MODES.map((mode) => (
            <Chip
              key={mode.id}
              label={t.setup.distanceModes[mode.id].label}
              onPress={() => updateSettings({ straightLine: mode.straightLine })}
              selected={settings.straightLine === mode.straightLine}
            />
          ))}
        </View>
        <Text style={styles.hint}>
          {t.setup.distanceModes[settings.straightLine ? 'inclination' : 'distance'].description}
        </Text>
      </Section>

      <Section title={t.setup.optionsTitle}>
        <Toggle
          {...t.setup.toggles.liveCompass}
          onValueChange={(value) => updateSettings({ liveCompass: value })}
          value={settings.liveCompass}
        />
        <Toggle
          {...t.setup.toggles.useGps}
          onValueChange={(value) => updateSettings({ useGps: value })}
          value={settings.useGps}
        />
        {!settings.useGps && (
          <CustomOriginInputs
            key={ready ? 'ready' : 'loading'}
            latitude={settings.customLatitude}
            longitude={settings.customLongitude}
            onChange={updateSettings}
          />
        )}
        <Toggle
          {...t.setup.toggles.showCountry}
          onValueChange={(value) => updateSettings({ showCountry: value })}
          value={settings.showCountry}
        />
        {settings.playerNames.length > 1 && (
          <Toggle
            {...t.setup.toggles.allowRevision}
            onValueChange={(value) => updateSettings({ allowRevision: value })}
            value={settings.allowRevision}
          />
        )}
        {settings.playerNames.length > 1 && (
          <Toggle
            {...t.setup.toggles.hideOtherAnswers}
            onValueChange={(value) => updateSettings({ hideOtherAnswers: value })}
            value={settings.hideOtherAnswers}
          />
        )}
      </Section>

      <Text style={styles.availability}>{t.setup.availability(available, settings.rounds)}</Text>
      <Button disabled={available === 0} label={t.setup.start} onPress={onStart} />
      <Button label={t.setup.back} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
