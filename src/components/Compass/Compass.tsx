import { useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { normalizeBearing } from '@/helpers';
import { useTheme } from '@/themes';

import { CompassDial } from './CompassDial';
import { NORTH_MARKER_HEIGHT, NORTH_MARKER_WIDTH } from './constants';
import { bearingFromTouch } from './helpers';
import type { CompassNeedle, CompassProps } from './types';
import { useHeading } from './useHeading';

// Reference stable : sinon la memoisation du cadran serait cassee a chaque rendu.
const NO_NEEDLES: CompassNeedle[] = [];

export const Compass = ({
  size,
  bearing,
  color,
  extraNeedles = NO_NEEDLES,
  truthBearing = null,
  live = false,
  onChange,
}: CompassProps) => {
  const { colors } = useTheme();
  const interactive = onChange !== undefined;

  // Cap du telephone : le cadran tourne de -cap pour que le N reste sur le vrai nord.
  const { heading, onTouch } = useHeading(live);
  const headingRef = useRef(0);
  headingRef.current = heading ?? 0;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onTouchRef = useRef(onTouch);
  onTouchRef.current = onTouch;

  const panResponder = useMemo(() => {
    const update = (x: number, y: number) => {
      // Angle a l'ecran, puis retour dans le repere du cadran (nord = 0).
      const next = Math.round(normalizeBearing(bearingFromTouch(x, y, size) + headingRef.current)) % 360;
      onChangeRef.current?.(next);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => onChangeRef.current !== undefined,
      onMoveShouldSetPanResponder: () => onChangeRef.current !== undefined,
      onMoveShouldSetPanResponderCapture: () => onChangeRef.current !== undefined,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        // Web : amorce le capteur d'orientation au premier contact (geste requis par iOS Safari).
        onTouchRef.current();
        update(event.nativeEvent.locationX, event.nativeEvent.locationY);
      },
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
      <View pointerEvents="none" style={heading !== null ? { transform: [{ rotate: `${-heading}deg` }] } : undefined}>
        <CompassDial
          bearing={bearing}
          color={color}
          extraNeedles={extraNeedles}
          size={size}
          truthBearing={truthBearing}
        />
      </View>

      {heading !== null && (
        // Repere fixe : le haut du telephone, face auquel le cadran tourne.
        <View pointerEvents="none" style={styles.marker}>
          <Svg height={NORTH_MARKER_HEIGHT} width={NORTH_MARKER_WIDTH}>
            <Polygon
              fill={colors.text}
              points={`0,0 ${NORTH_MARKER_WIDTH},0 ${NORTH_MARKER_WIDTH / 2},${NORTH_MARKER_HEIGHT}`}
            />
          </Svg>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: -NORTH_MARKER_HEIGHT - 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
