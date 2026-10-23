import { useMemo, useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { useTranslation } from '@/i18n';

import { CompassDial } from './CompassDial';
import { bearingFromTouch } from './helpers';
import type { CompassNeedle, CompassProps } from './types';

// Reference stable : sinon la memoisation du cadran casse a chaque rendu.
const NO_NEEDLES: CompassNeedle[] = [];

export const Compass = ({ size, needles = NO_NEEDLES, truthBearing = null, onChange }: CompassProps) => {
  const t = useTranslation();
  const interactive = onChange !== undefined;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Dernier cap envoye, mis a jour tout de suite dans `update` : deux touchmove sur le meme degre
  // avant le rendu sont ainsi dedupliques.
  const bearingRef = useRef(needles[0]?.bearing ?? null);
  bearingRef.current = needles[0]?.bearing ?? null;

  const panResponder = useMemo(() => {
    const update = (x: number, y: number) => {
      const next = bearingFromTouch(x, y, size);
      if (next === bearingRef.current) return;
      bearingRef.current = next;
      onChangeRef.current?.(next);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => onChangeRef.current !== undefined,
      onMoveShouldSetPanResponder: () => onChangeRef.current !== undefined,
      onMoveShouldSetPanResponderCapture: () => onChangeRef.current !== undefined,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        update(event.nativeEvent.locationX, event.nativeEvent.locationY);
      },
      onPanResponderMove: (event) => update(event.nativeEvent.locationX, event.nativeEvent.locationY),
    });
  }, [size]);

  return (
    <View
      accessibilityLabel={t.compassAccessibilityLabel}
      accessibilityRole={interactive ? 'adjustable' : 'image'}
      style={[
        { width: size, height: size },
        // Web : sans ca, un glisser vertical fait aussi defiler le ScrollView parent.
        interactive && Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle),
      ]}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <View pointerEvents="none">
        <CompassDial needles={needles} size={size} truthBearing={truthBearing} />
      </View>
    </View>
  );
};
