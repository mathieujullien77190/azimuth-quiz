import { Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import type { ContourGuessBarProps } from './types';

import { createStyles } from './styles';

/**
 * Silhouette's answer bar: a "Pays" label row, the country-name input (open to everybody, at any
 * time) and "Valider" (only for the turn-holder). Once the turn-holder has already guessed (`lockedText`) the field, its
 * label and "Valider" are hidden and only that message is shown: a hint is the only move left. Dumb — what a validated
 * guess *means* (who answered, who scores) is the caller's.
 */
export const ContourGuessBar = ({
  label,
  guessText,
  onChangeGuessText,
  onSubmit,
  wrongText = null,
  lockedText = null,
  canSubmit = true,
  onNotYourTurn,
}: ContourGuessBarProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const hasGuess = guessText.trim().length > 0;
  const submit = () => {
    if (!canSubmit) onNotYourTurn?.();
    else if (hasGuess) onSubmit();
  };

  return (
    <View style={styles.bar}>
      {wrongText !== null && <Text style={styles.wrongText}>{wrongText}</Text>}
      {lockedText !== null ? (
        <Text style={styles.lockedText}>{lockedText}</Text>
      ) : (
        <>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{label}</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              autoCapitalize="words"
              onChangeText={onChangeGuessText}
              onSubmitEditing={submit}
              placeholder={t.contourGame.guessPlaceholder}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              style={styles.input}
              value={guessText}
            />
          </View>
          <Button disabled={!canSubmit || !hasGuess} label={t.game.validate} onPress={onSubmit} />
        </>
      )}
    </View>
  );
};
