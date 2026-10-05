import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import { PRESSED_FADE, TOGGLE_EMOJI } from './constants';
import type { ReactionBarProps } from './types';

import { createStyles } from './styles';

/**
 * The emoji reactions control of a game's screen — dumb: one small round button floating just above the footer, at the
 * bottom-right corner (it positions itself against the footer it is a child of, and takes no room in it), and the column
 * of emojis it opens upward from it (shown and hidden at once, no animation), against the right edge of the screen. A tap on an emoji calls `onPick` with it and the column STAYS open (several
 * reactions in a row); only the round button closes it. What `onPick` does (sending it to the room, the cooldown) is the caller's.
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
