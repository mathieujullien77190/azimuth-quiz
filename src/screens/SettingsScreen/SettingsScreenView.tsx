import { Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import VersionLine from '@/components/ui/VersionLine';

import { APP_CODENAME, APP_VERSION_NUMBER, LANGUAGES, THEME_IDS } from './constants';
import { createStyles } from './SettingsScreenView.styles';
import type { SettingsScreenViewProps } from './types';

/** Pur rendu des reglages : langue, apparence, donnees, a propos. */
export const SettingsScreenView = ({
  language,
  themeId,
  dataCleared,
  onSelectLanguage,
  onSelectTheme,
  onClearData,
  onBack,
}: SettingsScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen>
      <Text style={styles.title}>{t.settings.title}</Text>

      <Section title={t.settings.languageTitle}>
        <View style={styles.chips}>
          {LANGUAGES.map((candidate) => (
            <Chip
              key={candidate}
              label={t.settings.languageOptions[candidate]}
              onPress={() => onSelectLanguage(candidate)}
              selected={language === candidate}
            />
          ))}
        </View>
      </Section>

      <Section title={t.settings.appearanceTitle}>
        <View style={styles.chips}>
          {THEME_IDS.map((candidate) => (
            <Chip
              key={candidate}
              label={t.settings.appearanceOptions[candidate]}
              onPress={() => onSelectTheme(candidate)}
              selected={themeId === candidate}
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
          <VersionLine codename={APP_CODENAME} style={styles.version} version={APP_VERSION_NUMBER} />
        </View>
      </Section>

      <Button label={t.setup.back} onPress={onBack} variant="ghost" />
    </Screen>
  );
};
