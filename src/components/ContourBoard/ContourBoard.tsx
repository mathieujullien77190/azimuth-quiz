import { useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/themes';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';

import {
  CONNECTOR_DASH_PATTERN,
  CONNECTOR_STROKE_WIDTH,
  HINT_ICON_FONT_SIZE,
  MARKER_EMOJI_FONT_SIZE,
  MARKER_LABEL_FONT_SIZE,
  MARKER_LABEL_GAP,
  MARKER_RADIUS,
  TRUTH_MARKER_RING_RADIUS,
  VISIBLE_STROKE_WIDTH,
} from './constants';
import { polylinePath } from './helpers';
import type { ContourBoardMarker, ContourBoardProps } from './types';

const NO_MARKERS: ContourBoardProps['markers'] = [];
const NO_CONNECTORS: ContourBoardProps['connectors'] = [];
const NO_HINT_LABELS: ContourBoardProps['hintLabels'] = [];

/** SVG + touch board: draws the country's fixed `outline` (the whole real border, no
 * interaction), any `markers`/`connectors`/`hintLabels` (city guesses, the true city,
 * guess-to-solution dashed lines, guess-phase hint icons/text), and the live `placedPoint`
 * marker on top. Touch capture follows the same
 * `PanResponder` pattern as `Compass` (a ref to avoid stale closures, `touchAction: 'none'` on
 * web so a vertical drag doesn't also scroll the page), active only while `onPlacePoint` is
 * passed — the board has no interaction at all outside of the city phase's tap-to-place-a-marker
 * step. */
export const ContourBoard = ({
  width,
  height,
  outline,
  markers = NO_MARKERS,
  connectors = NO_CONNECTORS,
  hintLabels = NO_HINT_LABELS,
  placedPoint,
  activeMarkerColor,
  onPlacePoint,
}: ContourBoardProps) => {
  const { colors, typography } = useTheme();
  const editable = onPlacePoint !== undefined;

  const onPlacePointRef = useRef(onPlacePoint);
  onPlacePointRef.current = onPlacePoint;

  const panResponder = useMemo(() => {
    const handle = (x: number, y: number) => onPlacePointRef.current?.({ x, y });

    return PanResponder.create({
      onStartShouldSetPanResponder: () => onPlacePointRef.current !== undefined,
      onMoveShouldSetPanResponder: () => onPlacePointRef.current !== undefined,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => handle(event.nativeEvent.locationX, event.nativeEvent.locationY),
      onPanResponderMove: (event) => handle(event.nativeEvent.locationX, event.nativeEvent.locationY),
    });
    // `handle` only reads a ref (never a prop directly), and the board remounts (via a `key` on
    // the caller side) every round anyway, so this never needs rebuilding after mount.
  }, []);

  return (
    <View
      style={[styles.board, { width, height }, editable && Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle)]}
      {...(editable ? panResponder.panHandlers : {})}
    >
      <Svg height={height} width={width}>
        <Path
          d={polylinePath(outline)}
          // A filled silhouette rather than a bare outline, matching the game mode's own name —
          // `surfaceHigh` reads as a raised panel over `ThemeBackdrop` in both themes.
          fill={colors.surfaceHigh}
          stroke={colors.textMuted}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={VISIBLE_STROKE_WIDTH}
        />
        {hintLabels.map((label, index) => (
          <SvgText
            fill={colors.text}
            fontFamily={label.icon ? FLAG_FONT_FAMILY : typography.heading.fontFamily}
            fontSize={label.icon ? HINT_ICON_FONT_SIZE : MARKER_LABEL_FONT_SIZE}
            fontWeight="800"
            key={index}
            textAnchor="middle"
            x={label.position.x}
            y={label.position.y}
          >
            {label.text}
          </SvgText>
        ))}
        {connectors.map((connector, index) => (
          <Path
            d={polylinePath([connector.from, connector.to])}
            fill="none"
            key={index}
            stroke={connector.color ?? colors.textMuted}
            strokeDasharray={CONNECTOR_DASH_PATTERN}
            strokeLinecap="round"
            strokeWidth={CONNECTOR_STROKE_WIDTH}
          />
        ))}
        {/* The truth (solution) dot drawn last/on top of every player guess dot — same order as
            the ring pass right below, so an overlapping guess never hides which dot is the truth.
            Skips a marker with its own `emoji` (a category icon replaces the plain dot for it —
            see ContourGameScreen's `placeEmoji`), rendered in its own pass below instead. */}
        {[...markers.filter((marker) => !marker.isTruth), ...markers.filter((marker) => marker.isTruth)]
          .filter((marker) => marker.emoji === undefined)
          .map((marker, index) => (
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
          .filter((marker): marker is ContourBoardMarker & { emoji: string } => marker.emoji !== undefined)
          .map((marker, index) => (
            <SvgText fill={colors.text} fontSize={MARKER_EMOJI_FONT_SIZE} key={`emoji-${index}`} textAnchor="middle" x={marker.position.x} y={marker.position.y + MARKER_EMOJI_FONT_SIZE / 3}>
              {marker.emoji}
            </SvgText>
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
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
  },
});
