import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { PLAYER_LABEL, SATELLITE_EMOJI, SATELLITE_QUIP } from '@/components/EarthSection/constants';
import { useTheme, useThemedStyles } from '@/themes';
import type { Coordinates } from '@/types';

import {
  AXIS_LABEL_SIZE,
  AXIS_RATIO,
  CAPTION_GLOBE,
  END_RADIUS,
  GLOBE_MARGIN,
  GUIDE_DASH,
  GUIDE_STEP,
  LABEL_OFFSET,
  ORBIT_MS,
  ORBIT_RATIO,
  ORBIT_TICK_MS,
  ORIGIN_RADIUS,
  POLE_RADIUS,
  ROUTE_STEPS,
  ROUTE_WIDTH,
  TRUTH_RING_RADIUS,
} from './constants';
import {
  centerOn,
  destinationPoint,
  dragCenter,
  equatorPoints,
  greenwichPoints,
  landPath,
  orbitPoint,
  parseRings,
  routePaths,
  routePoints,
  screenPoint,
} from './helpers';
import { GLOBE_LAND_PATH } from './globeLand';
import { createStyles } from './styles';
import type { Globe3DProps } from './types';
import { useOrbitAngle } from './useOrbitAngle';

const LAND_RINGS = parseRings(GLOBE_LAND_PATH);

/**
 * The Earth as a ball, turned with a finger. A 3D look done in 2D: an orthographic projection of the land outline and
 * of each answer's great-circle route, redrawn as the globe turns (no 3D engine). It first shows the side of the
 * Earth where the starting point and the answers are; a route going behind the globe is cut at its edge. The true
 * answer is only its circled end point, as on the Earth view.
 */
export const Globe3D = ({
  size,
  origin,
  marks,
  land: showLand = true,
  axis = true,
  equator = false,
  greenwich = false,
  satellite: withSatellite = true,
  draggable = true,
}: Globe3DProps) => {
  const { colors, compass, isDark, typography } = useTheme();
  // Room around the globe for the satellite, which flies above it.
  const styles = useThemedStyles(createStyles);
  const [showQuip, setShowQuip] = useState(false);
  const radius = (size / 2 - GLOBE_MARGIN) / ORBIT_RATIO;
  const cx = size / 2;
  const cy = size / 2;

  const ends = marks.map((item) => destinationPoint(origin, item.bearing, item.distanceKm));
  const [center, setCenter] = useState<Coordinates>(() => centerOn([origin, ...ends]));

  // The finger moves the surface: each move turns the globe by what the finger travelled since the previous one.
  const last = useRef({ dx: 0, dy: 0 });
  const pan = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        last.current = { dx: 0, dy: 0 };
      },
      onPanResponderMove: (_, gesture) => {
        const step = { dx: gesture.dx - last.current.dx, dy: gesture.dy - last.current.dy };
        last.current = { dx: gesture.dx, dy: gesture.dy };
        setCenter((current) => dragCenter(current, step.dx, step.dy, radius));
      },
    });
  }, [radius]);

  // Where each answer is on the drawing, and the visible parts of its route (none for the true answer, only circled).
  const drawnMarks = marks.map((item, index) => ({
    item,
    end: screenPoint(ends[index], center, cx, cy, radius),
    routes:
      item.isTruth === true
        ? []
        : routePaths(routePoints(origin, item.bearing, item.distanceKm, ROUTE_STEPS), center, cx, cy, radius),
  }));
  const start = screenPoint(origin, center, cx, cy, radius);
  const landD = useMemo(
    () => (showLand ? landPath(LAND_RINGS, center, cx, cy, radius) : ''),
    [showLand, center, cx, cy, radius],
  );
  const guides = useMemo(
    () =>
      [equator ? equatorPoints(GUIDE_STEP) : [], greenwich ? greenwichPoints(GUIDE_STEP) : []].flatMap((points) =>
        points.length === 0 ? [] : routePaths(points, center, cx, cy, radius),
      ),
    [equator, greenwich, center, cx, cy, radius],
  );

  // The satellite goes right round the Earth on the way from the starting point to the answer (the true one when there is
  // one), behind the globe too.
  const angle = useOrbitAngle(ORBIT_MS, ORBIT_TICK_MS);
  const guide = marks.find((item) => item.isTruth === true) ?? marks[0];
  const satellite =
    !withSatellite || !isDark || guide === undefined
      ? undefined
      : orbitPoint(origin, guide.bearing, angle, center, cx, cy, radius, ORBIT_RATIO);

  return (
    <View {...(draggable ? pan.panHandlers : {})}>
      <Svg accessibilityLabel={CAPTION_GLOBE} height={size} width={size}>
        <Circle cx={cx} cy={cy} fill={compass.faceOuter} r={radius} stroke={colors.border} strokeWidth={1.5} />
        {showLand && <Path d={landD} fill={colors.surfaceHigh} stroke={colors.border} strokeWidth={0.5} />}
        {guides.map((d, index) => (
          <Path
            d={d}
            fill="none"
            key={`guide-${index}`}
            stroke={colors.textMuted}
            strokeDasharray={GUIDE_DASH}
            strokeWidth={1}
          />
        ))}

        {axis && (
          <>
            <Line
              stroke={colors.textMuted}
              strokeWidth={1.5}
              x1={cx}
              x2={cx}
              y1={cy + radius * AXIS_RATIO}
              y2={cy - radius * AXIS_RATIO}
            />
            {center.latitude >= 0 && (
              <Circle
                cx={cx}
                cy={cy - radius * Math.cos((center.latitude * Math.PI) / 180)}
                fill={colors.text}
                r={POLE_RADIUS}
              />
            )}
            <SvgText
              fill={colors.text}
              fontFamily={typography.heading.fontFamily}
              fontSize={AXIS_LABEL_SIZE}
              fontWeight="800"
              textAnchor="start"
              x={cx + POLE_RADIUS + 3}
              y={cy - radius * AXIS_RATIO + AXIS_LABEL_SIZE / 2}
            >
              N
            </SvgText>
          </>
        )}

        {drawnMarks.map(({ item, end, routes }, index) => {
          const isTruth = item.isTruth === true;
          return (
            <G key={`mark-${index}`} opacity={item.opacity ?? 1}>
              {routes.map((d, part) => (
                <Path
                  d={d}
                  fill="none"
                  key={`route-${part}`}
                  stroke={item.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={ROUTE_WIDTH}
                />
              ))}
              {end.visible && (
                <Circle
                  cx={end.x}
                  cy={end.y}
                  fill={item.color}
                  r={END_RADIUS}
                  stroke={colors.surface}
                  strokeWidth={1.5}
                />
              )}
              {end.visible && isTruth && (
                <Circle cx={end.x} cy={end.y} fill="none" r={TRUTH_RING_RADIUS} stroke={item.color} strokeWidth={2} />
              )}
            </G>
          );
        })}

        {start.visible && (
          <>
            <Circle
              cx={start.x}
              cy={start.y}
              fill={colors.text}
              r={ORIGIN_RADIUS}
              stroke={colors.surface}
              strokeWidth={1.5}
            />
            <SvgText
              fill={colors.text}
              fontFamily={typography.heading.fontFamily}
              fontSize={11}
              fontWeight="800"
              textAnchor="middle"
              x={start.x}
              y={start.y - LABEL_OFFSET}
            >
              {PLAYER_LABEL}
            </SvgText>
          </>
        )}
      </Svg>
      {satellite?.visible === true && (
        <View style={[styles.satellite, { left: satellite.x - 10, top: satellite.y - 10 }]}>
          {/* Like the satellite of the Earth view: a tap shows a joke, a second one hides it. */}
          <Pressable hitSlop={10} onPress={() => setShowQuip((value) => !value)}>
            <Text style={styles.satelliteEmoji}>{SATELLITE_EMOJI}</Text>
          </Pressable>
          {showQuip && (
            <View pointerEvents="none" style={styles.quipWrap}>
              <View style={styles.quipBubble}>
                <Text style={styles.quipText}>{SATELLITE_QUIP}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
