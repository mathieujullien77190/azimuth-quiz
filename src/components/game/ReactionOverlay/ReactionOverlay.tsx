import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { USE_NATIVE_DRIVER } from '@/helpers';

import { useThemedStyles } from '@/themes';

import { BOTTOM_OFFSET, FADE_IN_END, FADE_OUT_START, RISE_MS } from './constants';
import { laneOffset, wobbleCurve } from './helpers';
import type { ReactionBubbleProps, ReactionOverlayProps } from './types';

import { createStyles } from './styles';

const WOBBLE = wobbleCurve();

/**
 * Un emoji qui monte comme une bulle du bas au haut de l'overlay, en oscillant et en fondu, avec le nom de
 * l'envoyeur dessous. Joue sa course puis demande son retrait.
 */
const ReactionBubble = ({ reaction, travel, onDone }: ReactionBubbleProps) => {
  const styles = useThemedStyles(createStyles);
  // State plutot que ref : la valeur est lue au rendu (interpolations ci-dessous).
  const [progress] = useState(() => new Animated.Value(0));
  const { seq } = reaction;

  useEffect(() => {
    Animated.timing(progress, {
      duration: RISE_MS,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    const timeout = setTimeout(() => onDone(seq), RISE_MS);
    return () => {
      clearTimeout(timeout);
      progress.stopAnimation();
    };
  }, [onDone, progress, seq]);

  return (
    <Animated.View
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
 * Reactions recues de la room, sur tout l'ecran : chaque nouvelle `reaction` (distinguee par `seq`) est une bulle
 * qui monte du bas (au-dessus du footer) puis disparait. Plusieurs d'affilee ne se remplacent pas. Ne capte jamais
 * le toucher (`pointerEvents: 'none'` dans le style) : le jeu reste jouable dessous.
 */
export const ReactionOverlay = ({ reaction }: ReactionOverlayProps) => {
  const styles = useThemedStyles(createStyles);
  const [height, setHeight] = useState(0);
  const [lastSeq, setLastSeq] = useState<number | null>(reaction?.seq ?? null);
  const [bubbles, setBubbles] = useState<ReactionBubbleProps['reaction'][]>(reaction === null ? [] : [reaction]);
  // Derive au rendu, comme le hook qui l'alimente : la bulle existe dans le rendu qui recoit la reaction.
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
    <View onLayout={onLayout} style={styles.overlay}>
      {bubbles.map((bubble) => (
        <ReactionBubble key={bubble.seq} onDone={removeBubble} reaction={bubble} travel={travel} />
      ))}
    </View>
  );
};
