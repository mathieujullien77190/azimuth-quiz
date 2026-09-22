import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import ThemeBackdrop from '../ThemeBackdrop';
import Button from '../ui/Button';
import { QUIT_LABEL, READY_LABEL, SECRET_HINT } from './constants';
import { initialOf } from './helpers';
import type { HandoffScreenProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
      gap: spacing.md,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    round: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    avatar: {
      width: 132,
      height: 132,
      borderRadius: 66,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.background,
    },
    initial: {
      ...typography.display,
      color: colors.background,
      fontSize: 64,
    },
    name: {
      ...typography.display,
      color: colors.text,
      fontSize: fontSize.display,
      textAlign: 'center',
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
  });

export const HandoffScreen = ({ player, roundNumber, totalRounds, onReady, onQuit }: HandoffScreenProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemeBackdrop />
      <View style={styles.center}>
        <Text style={styles.round}>
          Manche {roundNumber} / {totalRounds}
        </Text>
        <View style={[styles.avatar, { backgroundColor: player.color }]}>
          <Text style={styles.initial}>{initialOf(player.name)}</Text>
        </View>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.hint}>Passe-lui le téléphone. {SECRET_HINT}</Text>
      </View>
      <Button label={READY_LABEL} onPress={onReady} />
      <Button label={QUIT_LABEL} onPress={onQuit} variant="ghost" />
    </SafeAreaView>
  );
};
