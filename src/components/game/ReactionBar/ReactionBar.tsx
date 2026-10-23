import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import { PRESSED_FADE, TOGGLE_EMOJI } from './constants';
import type { ReactionBarProps } from './types';

import { createStyles } from './styles';

/**
 * Controle des reactions emoji d'un ecran de jeu : bouton rond flottant au-dessus du footer (positionne contre
 * lui, sans prendre de place) et colonne d'emojis qui s'ouvre vers le haut, sans animation. Un emoji appelle
 * `onPick` et la colonne RESTE ouverte ; seul le bouton la ferme. Ce que fait `onPick` revient a l'appelant.
 */
export const ReactionBar = ({ emojis, onPick, labelFor, toggleLabel }: ReactionBarProps) => {
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const fade = (pressed: boolean) => ({ opacity: 1 - Number(pressed) * PRESSED_FADE });

  return (
    <View style={styles.bar}>
      {open && (
        <View style={styles.column}>
          {emojis.map((emoji) => (
            <Pressable
              key={emoji}
              accessibilityLabel={labelFor(emoji)}
              accessibilityRole="button"
              onPress={() => onPick(emoji)}
              style={({ pressed }) => [styles.button, fade(pressed)]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        accessibilityLabel={toggleLabel}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.toggle, fade(pressed)]}
      >
        <Text style={styles.toggleEmoji}>{TOGGLE_EMOJI}</Text>
      </Pressable>
    </View>
  );
};
