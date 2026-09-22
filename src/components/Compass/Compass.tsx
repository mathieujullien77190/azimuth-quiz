import { useMemo, useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { normalizeBearing } from '@/helpers';

import { CompassDial } from './CompassDial';
import { bearingFromTouch } from './helpers';
import type { CompassNeedle, CompassProps } from './types';

// Reference stable : sinon la memoisation du cadran serait cassee a chaque rendu.
const NO_NEEDLES: CompassNeedle[] = [];

/** Le nord reste toujours en haut du cadran : pas de rotation liee a l'orientation du telephone. */
export const Compass = ({
  size,
  bearing,
  color,
  extraNeedles = NO_NEEDLES,
  truthBearing = null,
  onChange,
}: CompassProps) => {
  const interactive = onChange !== undefined;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const panResponder = useMemo(() => {
    const update = (x: number, y: number) => {
      const next = Math.round(normalizeBearing(bearingFromTouch(x, y, size))) % 360;
      onChangeRef.current?.(next);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => onChangeRef.current !== undefined,
      onMoveShouldSetPanResponder: () => onChangeRef.current !== undefined,
      onMoveShouldSetPanResponderCapture: () => onChangeRef.current !== undefined,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => update(event.nativeEvent.locationX, event.nativeEvent.locationY),
      onPanResponderMove: (event) => update(event.nativeEvent.locationX, event.nativeEvent.locationY),
    });
  }, [size]);

  return (
    <View
      accessibilityLabel="Boussole"
      accessibilityRole={interactive ? 'adjustable' : 'image'}
      style={[
        { width: size, height: size },
        // Web : sans ca, un glisse vertical sur le cadran fait aussi defiler la ScrollView parente
        // (le PanResponder capture bien le geste RN, mais le navigateur scrolle quand meme).
        interactive && Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle),
      ]}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <CompassDial bearing={bearing} color={color} extraNeedles={extraNeedles} size={size} truthBearing={truthBearing} />
    </View>
  );
};
