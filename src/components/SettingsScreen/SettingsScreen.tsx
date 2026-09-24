import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { clearAppData } from '@/helpers';
import { useLanguage, useTranslation, type Language } from '@/i18n';
import { useSettings } from '@/settings';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Screen from '../ui/Screen';
import Section from '../ui/Section';
import { APP_VERSION } from './constants';
import type { SettingsScreenProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
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
    about: {
      gap: spacing.sm,
    },
    aboutLine: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    version: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });

export const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { language, setLanguage, resetLanguage } = useLanguage();
  const { resetSettings } = useSettings();
  const t = useTranslation();
  const [dataCleared, setDataCleared] = useState(false);

  const languages: Language[] = ['fr', 'en'];

  // Clears storage AND resets the in-memory contexts to defaults: otherwise the app would keep
  // the old values (Boussole settings, language) until it's relaunched.
  const onClearData = () => {
    clearAppData();
    resetSettings();
    resetLanguage();
    setDataCleared(true);
  };

  return (
    <Screen>
      <Text style={styles.title}>{t.settings.title}</Text>

      <Section title={t.settings.languageTitle}>
        <View style={styles.chips}>
          {languages.map((candidate) => (
            <Chip
              key={candidate}
              label={t.settings.languageOptions[candidate]}
              onPress={() => setLanguage(candidate)}
              selected={language === candidate}
            />
          ))}
        </View>
      </Section>

      <Section title={t.settings.dataTitle}>
        <View style={styles.about}>
          <Text style={styles.aboutLine}>{t.settings.dataHint}</Text>
          <Button
            disabled={dataCleared}
            label={dataCleared ? t.settings.dataCleared : t.settings.clearData}
            onPress={onClearData}
            variant="ghost"
          />
        </View>
      </Section>

      <Section title={t.settings.aboutTitle}>
        <View style={styles.about}>
          <Text style={styles.aboutLine}>{t.settings.author}</Text>
          <Text style={styles.aboutLine}>{t.settings.claudeMention}</Text>
          <Text style={styles.version}>{APP_VERSION}</Text>
        </View>
      </Section>

      <Button label={t.setup.back} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
