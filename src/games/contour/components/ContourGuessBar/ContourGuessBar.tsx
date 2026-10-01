import { Pressable, Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import type { ContourGuessBarProps } from './types';

import { createStyles } from './styles';

/**
 * Silhouette's answer bar, shared by the local and the online game: hint button, country-name input
 * and "Valider". Dumb — what a validated guess *means* (who answered, who scores) is the caller's.
 */
export const ContourGuessBar = ({
  guessText,
  onChangeGuessText,
  onSubmit,
  wrongText = null,
  readOnly = false,
  onReadOnlyPress,
}: ContourGuessBarProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  // Spectators see the turn-holder's text in the field: only what this device typed itself can be validated.
  const canSubmit = !readOnly && guessText.trim().length > 0;

  return (
    <View style={styles.bar}>
      {wrongText !== null && <Text style={styles.wrongText}>{wrongText}</Text>}
      <Pressable disabled={!readOnly} onPress={onReadOnlyPress} style={styles.inputRow}>
        <TextInput
          autoCapitalize="words"
          editable={!readOnly}
          onChangeText={onChangeGuessText}
          onSubmitEditing={() => canSubmit && onSubmit()}
          placeholder={t.contourGame.guessPlaceholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          style={styles.input}
          value={guessText}
        />
      </Pressable>
      <Button disabled={!canSubmit} label={t.game.validate} onPress={onSubmit} />
    </View>
  );
};
