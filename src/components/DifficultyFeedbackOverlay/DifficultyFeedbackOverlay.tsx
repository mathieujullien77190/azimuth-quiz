import { Modal, Pressable, Text, View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import { formatDifficulty } from '@/components/DifficultyBadge/helpers';
import type { DifficultyFeedbackOverlayProps } from './types';

import { createStyles } from './styles';

/**
 * Question du mode dev apres une manche (dumb). Un tap sur une reponse appelle `onChoose` ;
 * un tap ailleurs (le fond) appelle `onDismiss` et le jeu continue.
 */
export const DifficultyFeedbackOverlay = ({ question, onChoose, onDismiss }: DifficultyFeedbackOverlayProps) => {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();

  return (
    <Modal animationType="fade" onRequestClose={onDismiss} transparent visible={question !== null}>
      <Pressable accessibilityLabel={t.devFeedback.dismiss} onPress={onDismiss} style={styles.backdrop}>
        {/* Un tap sur la carte elle-meme ne doit pas compter comme "a cote des reponses". */}
        <Pressable onPress={() => {}} style={styles.card}>
          <Text style={styles.question}>{question}</Text>
          <View style={styles.answers}>
            {DIFFICULTIES.map((entry) => (
              <Pressable
                accessibilityRole="button"
                key={entry.id}
                onPress={() => onChoose(entry.id)}
                style={styles.answer}
              >
                <Text style={styles.answerLabel}>
                  {formatDifficulty(difficultyEmoji(entry, isDark), t.setup.difficulties[entry.id])}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
