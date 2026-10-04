import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { useThemedStyles } from '@/themes';

import { BOTTOM_OFFSET, FADE_IN_END, FADE_OUT_START, RISE_MS } from './constants';
import { laneOffset, wobbleCurve } from './helpers';
import type { ReactionBubbleProps, ReactionOverlayProps } from './types';

import { createStyles } from './styles';

const WOBBLE = wobbleCurve();

/** One emoji rising like a bubble in water, from the bottom of the overlay to its top, drifting left and right, fading
 * in then out, its sender's name under it travelling along. Runs its own course, then asks to be removed. */
const ReactionBubble = ({ reaction, travel, onDone }: ReactionBubbleProps) => {
  const styles = useThemedStyles(createStyles);
  // State rather than a ref: the value is read while rendering (the interpolations below).
  const [progress] = useState(() => new Animated.Value(0));
  const { seq } = reaction;

  useEffect(() => {
    Animated.timing(progress, { duration: RISE_MS, easing: Easing.linear, toValue: 1, useNativeDriver: true }).start();
    const timeout = setTimeout(() => onDone(seq), RISE_MS);
    return () => {
      clearTimeout(timeout);
      progress.stopAnimation();
    };
  }, [onDone, progress, seq]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          bottom: BOTTOM_OFFSET,
          opacity: progress.interpolate({
            inputRange: [0, FADE_IN_END, FADE_OUT_START, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] }) },
            {
              translateX: progress.interpolate({
                inputRange: WOBBLE.inputRange,
                outputRange: WOBBLE.outputRange.map((drift) => drift + laneOffset(reaction.seq)),
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.emoji}>{reaction.emoji}</Text>
        {reaction.name !== null && <Text style={styles.name}>{reaction.name}</Text>}
      </View>
    </Animated.View>
  );
};

/**
 * The reactions received from the room, over the whole screen — dumb: each new `reaction` (told apart by its `seq`) is a
 * bubble that rises from the bottom, above the footer, up to the top of the screen, and goes. Several in a row each run
 * their own course instead of replacing one another. Never catches a touch (`pointerEvents="none"`): the game stays
 * playable under it.
 */
export const ReactionOverlay = ({ reaction }: ReactionOverlayProps) => {
  const styles = useThemedStyles(createStyles);
  const [height, setHeight] = useState(0);
  const [lastSeq, setLastSeq] = useState<number | null>(reaction?.seq ?? null);
  const [bubbles, setBubbles] = useState<ReactionBubbleProps['reaction'][]>(reaction === null ? [] : [reaction]);
  // Derived while rendering, like the hook that feeds it: the bubble exists in the very render that got the reaction.
  if (reaction !== null && reaction.seq !== lastSeq) {
    setLastSeq(reaction.seq);
    setBubbles([...bubbles, reaction]);
  }

  const removeBubble = useCallback(
    (seq: number) => setBubbles((current) => current.filter((other) => other.seq !== seq)),
    [],
  );
  const onLayout = (event: LayoutChangeEvent) => setHeight(event.nativeEvent.layout.height);
  const travel = Math.max(height - BOTTOM_OFFSET, 0);

  return (
    <View onLayout={onLayout} pointerEvents="none" style={styles.overlay}>
      {bubbles.map((bubble) => (
        <ReactionBubble
          key={bubble.seq}
          onDone={removeBubble}
          reaction={bubble}
          travel={travel}
        />
      ))}
    </View>
  );
};
