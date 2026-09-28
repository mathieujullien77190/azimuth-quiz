import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import ThemeBackdrop from '@/components/ThemeBackdrop';

import { createStyles } from './styles';

/** Full-screen "Préparation de la partie…" shown between pressing "Lancer la partie" and the game
 * screen taking over — shared by every game's setup and online game screens. */
export const LoadingScreen = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();

  return (
    <SafeAreaView style={styles.loading}>
      <ThemeBackdrop />
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.loadingText}>{t.game.loading}</Text>
    </SafeAreaView>
  );
};
