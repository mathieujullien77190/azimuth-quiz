import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import { POP_FROM_SCALE, POP_MS, PRESSED_FADE, TOGGLE_EMOJI } from './constants';
import type { ReactionBarProps } from './types';

import { createStyles } from './styles';

/**
 * The emoji reactions control of a game's screen — dumb: one small round button floating just above the footer, at the
 * bottom-right corner (it positions itself against the footer it is a child of, and takes no room in it), and the column
 * of emojis it pops open upward from it, against the right edge of the screen. A tap on an emoji calls `onPick` with it and closes the
 * column; the round button closes it too. What `onPick` does (sending it to the room, the cooldown) is the caller's.
 */
export const ReactionBar = ({ emojis, onPick, labelFor, toggleLabel }: ReactionBarProps) => {
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  // State rather than a ref: the value is read while rendering (the interpolation below).
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!open) return undefined;
    pop.setValue(0);
    Animated.timing(pop, {
      duration: POP_MS,
      easing: Easing.out(Easing.back(2)),
      toValue: 1,
      useNativeDriver: true,
    }).start();
    return () => pop.stopAnimation();
  }, [open, pop]);

  const fade = (pressed: boolean) => ({ opacity: 1 - Number(pressed) * PRESSED_FADE });

  return (
    <View style={styles.bar}>
      {open && (
        <Animated.View
          style={[
            styles.column,
            {
              opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [POP_FROM_SCALE, 1] }) }],
            },
          ]}
        >
          {emojis.map((emoji) => (
            <Pressable
              key={emoji}
              accessibilityLabel={labelFor(emoji)}
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                onPick(emoji);
              }}
              style={({ pressed }) => [styles.button, fade(pressed)]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </Animated.View>
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
