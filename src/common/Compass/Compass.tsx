import { useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { normalizeBearing } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import { CompassDial } from './CompassDial';
import { NORTH_MARKER_HEIGHT, NORTH_MARKER_WIDTH } from './constants';
import { bearingFromTouch } from './helpers';
import type { CompassNeedle, CompassProps } from './types';
import { useHeading } from './useHeading';

// Stable reference: otherwise the dial's memoization would be broken on every render.
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
  const t = useTranslation();
  const interactive = onChange !== undefined;

  // Phone heading: the dial rotates by -heading so N stays on true north.
  const { heading, onTouch } = useHeading(live);
  const headingRef = useRef(0);
  headingRef.current = heading ?? 0;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onTouchRef = useRef(onTouch);
  onTouchRef.current = onTouch;
  // Tracks the last bearing actually sent, updated eagerly inside `update` (not just from the
  // `bearing` prop on render) so two touch-move events landing on the same degree before React
  // re-renders still dedupe — avoids re-rendering the whole GameScreen for a no-op move.
  const bearingRef = useRef(bearing);
  bearingRef.current = bearing;

  const panResponder = useMemo(() => {
    const update = (x: number, y: number) => {
      // Angle on screen, then converted back into the dial's frame (north = 0).
      const next = Math.round(normalizeBearing(bearingFromTouch(x, y, size) + headingRef.current)) % 360;
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
        // Web: kicks off the orientation sensor on the first touch (gesture required by iOS Safari).
        onTouchRef.current();
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
        // Web: without this, a vertical drag on the dial also scrolls the parent ScrollView
        // (the PanResponder does capture the RN gesture, but the browser scrolls anyway).
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
        // Fixed marker: the top of the phone, which the dial rotates against.
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
