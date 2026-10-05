import { Modal, Pressable, Text, View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import { formatDifficulty } from '@/components/DifficultyBadge/helpers';
import type { DifficultyFeedbackOverlayProps } from './types';

import { createStyles } from './styles';

/**
 * The dev mode's question after a round: "Le lieu Paris était-il… 🟢 Facile / 🟡 Moyen / 🔴 Difficile". Dumb. A tap on one
 * of the three answers calls `onChoose`; a tap anywhere else (the backdrop) calls `onDismiss` and the game goes on.
 */
export const DifficultyFeedbackOverlay = ({ question, onChoose, onDismiss }: DifficultyFeedbackOverlayProps) => {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();

  return (
    <Modal animationType="fade" onRequestClose={onDismiss} transparent visible={question !== null}>
      <Pressable accessibilityLabel={t.devFeedback.dismiss} onPress={onDismiss} style={styles.backdrop}>
        {/* A tap on the card itself (its text, its gaps) must not read as "beside the answers". */}
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
