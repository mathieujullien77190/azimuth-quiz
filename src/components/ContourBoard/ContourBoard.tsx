import { forwardRef, useEffect, useMemo, useRef } from 'react';
import type { ComponentProps, ElementRef } from 'react';
import { Animated, Easing, PanResponder, Platform, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { useTheme, useThemeSettings } from '@/themes';
import type { Point2D } from '@/types';

import {
  ANCHOR_RADIUS,
  CONNECTOR_DASH_PATTERN,
  CONNECTOR_STROKE_WIDTH,
  HOLE_MARKER_RADIUS,
  MARKER_LABEL_FONT_SIZE,
  MARKER_LABEL_GAP,
  MARKER_RADIUS,
  TRACE_STROKE_WIDTH,
  TRUTH_DRAW_DURATION_MS,
  TRUTH_MARKER_RING_RADIUS,
  VISIBLE_STROKE_WIDTH,
} from './constants';
import { polylineLength, polylinePath } from './helpers';
import type { ContourBoardMarker, ContourBoardProps } from './types';

const NO_ANCHORS: ContourBoardProps['anchors'] = [];
const NO_HOLE_MARKERS: ContourBoardProps['holeMarkers'] = [];
const NO_TRACES: ContourBoardProps['traces'] = [];
const NO_MARKERS: ContourBoardProps['markers'] = [];
const NO_CONNECTORS: ContourBoardProps['connectors'] = [];

// `Animated.createAnimatedComponent` injects a `collapsable` prop meant for native Views; SVG
// `Path` (a web DOM `<path>` under react-native-web) forwards unrecognized props straight to the
// DOM instead of understanding it, which React then warns about ("non-boolean attribute"). This
// wrapper strips it before it reaches the real `Path`, while still forwarding the ref
// `Animated.createAnimatedComponent` needs to update `strokeDashoffset` imperatively.
const PathWithoutCollapsable = forwardRef<ElementRef<typeof Path>, ComponentProps<typeof Path> & { collapsable?: boolean }>(
  function PathWithoutCollapsable({ collapsable: _collapsable, ...pathProps }, ref) {
    return <Path ref={ref} {...pathProps} />;
  },
);
// `strokeDashoffset` is an SVG prop, not a transform/opacity style: unlike EarthSection's
// satellite orbit (rotate/translateY), the native driver can't animate it at all, on any
// platform — see the `useNativeDriver: false` on its `Animated.timing` below.
const AnimatedPath = Animated.createAnimatedComponent(PathWithoutCollapsable);

/** SVG + touch board: draws the country's fixed `visible` arcs (one per hole gap, or a single one
 * in solo), any extra `anchors`/`holeMarkers`/`traces`/`markers` (still-unclaimed holes' anchor
 * dots and numbered badges, claimed holes' true arcs, city markers), and the live `activePoints`
 * trace or `placedPoint` marker on top. Touch capture follows the same `PanResponder` pattern as
 * `Compass` (refs to avoid stale closures, `touchAction: 'none'` on web so a vertical drag doesn't
 * also scroll the page) and is in exactly one of two mutually exclusive modes at a time, picked by
 * which callback prop the caller passes: `onDraw` appends to a multi-point trace, `onPlacePoint`
 * moves a single marker. */
export const ContourBoard = ({
  width,
  height,
  visible,
  anchors = NO_ANCHORS,
  holeMarkers = NO_HOLE_MARKERS,
  traces = NO_TRACES,
  markers = NO_MARKERS,
  connectors = NO_CONNECTORS,
  activePoints,
  activeColor,
  placedPoint,
  activeMarkerColor,
  onDraw,
  onPlacePoint,
}: ContourBoardProps) => {
  const { colors, typography } = useTheme();
  const { animationsEnabled } = useThemeSettings();
  const editable = onDraw !== undefined || onPlacePoint !== undefined;

  // Truth traces (claimed holes, `isTruth`) always render last (on top of player traces and city
  // markers). The caller can reveal them one at a time, as each hole gets claimed (see
  // ContourGameScreen's `revealedTraces`) — so each trace's `key` gets its own `Animated.Value`,
  // played once the first render it appears in, independent of whichever others are already mid-
  // animation or already done. `d`/length are derived once per trace here (not re-derived per
  // frame): `strokeDashoffset` only ever reads the cheap `interpolate`.
  const revealValuesRef = useRef(new Map<string | number, Animated.Value>());
  const revealStartedKeysRef = useRef(new Set<string | number>());
  const truthEntries = traces
    .filter((trace) => trace.isTruth)
    .map((trace, index) => {
      const key = trace.key ?? index;
      let progress = revealValuesRef.current.get(key);
      if (!progress) {
        progress = new Animated.Value(0);
        revealValuesRef.current.set(key, progress);
      }
      return { trace, key, d: polylinePath(trace.points), length: polylineLength(trace.points), progress };
    });
  const otherTraces = traces.filter((trace) => !trace.isTruth);

  useEffect(() => {
    truthEntries.forEach(({ key, progress }) => {
      if (revealStartedKeysRef.current.has(key)) return;
      revealStartedKeysRef.current.add(key);
      if (!animationsEnabled) {
        progress.setValue(1);
        return;
      }
      Animated.timing(progress, {
        duration: TRUTH_DRAW_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: false,
      }).start();
    });
    // No dependency array: must recheck every render since a new hole can join `truthEntries` at
    // any point (turn by turn, see above) — cheap either way, `revealStartedKeysRef` turns every
    // already-handled key into an immediate no-op.
  });

  const onDrawRef = useRef(onDraw);
  onDrawRef.current = onDraw;
  const onPlacePointRef = useRef(onPlacePoint);
  onPlacePointRef.current = onPlacePoint;
  const pointsRef = useRef<Point2D[]>(activePoints ?? []);
  pointsRef.current = activePoints ?? [];

  const panResponder = useMemo(() => {
    const handle = (x: number, y: number) => {
      if (onDrawRef.current !== undefined) {
        // Appends to pointsRef instead of resetting it: lifting the finger and touching down
        // again (e.g. to rest, or after switching to another player's tab and back) resumes the
        // trace instead of discarding what was already drawn.
        const next = [...pointsRef.current, { x, y }];
        pointsRef.current = next;
        onDrawRef.current(next);
        return;
      }
      onPlacePointRef.current?.({ x, y });
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => onDrawRef.current !== undefined || onPlacePointRef.current !== undefined,
      onMoveShouldSetPanResponder: () => onDrawRef.current !== undefined || onPlacePointRef.current !== undefined,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => handle(event.nativeEvent.locationX, event.nativeEvent.locationY),
      onPanResponderMove: (event) => handle(event.nativeEvent.locationX, event.nativeEvent.locationY),
    });
    // `handle` only reads refs (never `width`/`height` directly), and the board remounts (via a
    // `key` on the caller side) every round anyway, so this never needs rebuilding after mount.
  }, []);

  return (
    <View
      style={[styles.board, { width, height }, editable && Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle)]}
      {...(editable ? panResponder.panHandlers : {})}
    >
      <Svg height={height} width={width}>
        {visible.map((segment, index) => (
          <Path
            d={polylinePath(segment)}
            fill="none"
            key={index}
            stroke={colors.textMuted}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={VISIBLE_STROKE_WIDTH}
          />
        ))}
        {otherTraces.map((trace, index) => (
          <Path
            d={polylinePath(trace.points)}
            fill="none"
            key={index}
            stroke={trace.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={TRACE_STROKE_WIDTH}
          />
        ))}
        {activePoints !== undefined && activeColor !== undefined && (
          <Path
            d={polylinePath(activePoints)}
            fill="none"
            stroke={activeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={TRACE_STROKE_WIDTH}
          />
        )}
        {anchors.map((anchor, index) => (
          <Circle cx={anchor.x} cy={anchor.y} fill={colors.surface} key={index} r={ANCHOR_RADIUS} stroke={colors.text} strokeWidth={2} />
        ))}
        {holeMarkers.map((marker, index) => (
          <Circle
            cx={marker.position.x}
            cy={marker.position.y}
            fill={colors.accent}
            key={index}
            r={HOLE_MARKER_RADIUS}
            stroke={colors.surface}
            strokeWidth={2}
          />
        ))}
        {connectors.map((connector, index) => (
          <Path
            d={polylinePath([connector.from, connector.to])}
            fill="none"
            key={index}
            stroke={colors.textMuted}
            strokeDasharray={CONNECTOR_DASH_PATTERN}
            strokeLinecap="round"
            strokeWidth={CONNECTOR_STROKE_WIDTH}
          />
        ))}
        {markers.map((marker, index) => (
          <Circle
            cx={marker.position.x}
            cy={marker.position.y}
            fill={marker.color}
            key={index}
            r={MARKER_RADIUS}
            stroke={colors.surface}
            strokeWidth={2}
          />
        ))}
        {markers
          .filter((marker) => marker.isTruth)
          .map((marker, index) => (
            <Circle
              cx={marker.position.x}
              cy={marker.position.y}
              fill="none"
              key={`ring-${index}`}
              r={TRUTH_MARKER_RING_RADIUS}
              stroke={marker.color}
              strokeWidth={2}
            />
          ))}
        {markers
          .filter((marker): marker is ContourBoardMarker & { label: string } => marker.label !== undefined)
          .map((marker, index) => (
            <SvgText
              fill={colors.text}
              fontFamily={typography.heading.fontFamily}
              fontSize={MARKER_LABEL_FONT_SIZE}
              fontWeight="800"
              key={`marker-label-${index}`}
              x={marker.position.x + MARKER_RADIUS + MARKER_LABEL_GAP}
              y={marker.position.y + MARKER_LABEL_FONT_SIZE / 3}
            >
              {marker.label}
            </SvgText>
          ))}
        {placedPoint !== undefined && activeMarkerColor !== undefined && (
          <Circle
            cx={placedPoint.x}
            cy={placedPoint.y}
            fill={activeMarkerColor}
            r={MARKER_RADIUS}
            stroke={colors.surface}
            strokeWidth={2}
          />
        )}
        {truthEntries.map(({ trace, key, d, length, progress }) => (
          <AnimatedPath
            d={d}
            fill="none"
            key={key}
            stroke={trace.color}
            strokeDasharray={length}
            strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [length, 0] })}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={TRACE_STROKE_WIDTH}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
  },
});
