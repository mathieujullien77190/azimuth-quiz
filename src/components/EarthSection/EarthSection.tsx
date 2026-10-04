import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import Globe3D from '@/components/Globe3D';
import { useTheme, useThemedStyles } from '@/themes';

import {
  AVAILABLE_X_RATIO,
  BOTTOM_MARGIN,
  CAPTION_SURFACE,
  EARTH_RADIUS_RATIO,
  HEIGHT_RATIO,
  PLAYER_LABEL,
  PLAYER_Y_RATIO,
  SATELLITE_CLEARANCE,
  SATELLITE_EMOJI,
  SATELLITE_ORBIT_MS,
  SATELLITE_QUIP,
  SWITCH_TO_EARTH,
  SWITCH_TO_GLOBE,
  ZOOM_STEPS,
} from './constants';
import { arcPath, fitZoom, markEnd, sideOf, surfaceAngle } from './helpers';
import type { EarthMark, EarthSectionProps, Point } from './types';

import { createStyles } from './styles';

/**
 * The Earth seen from the side, the player at the very top. Each answer starts from the side of
 * its heading (heading west = left, heading east = right) and draws as an arc following the circle
 * (surface distance).
 * The circle zooms continuously on its apex so nearby markers stay legible: the shorter
 * `marks`' distances are, the higher the "ideal" zoom (`fitZoom`) climbs, among `ZOOM_STEPS`.
 * On reveal (`zoomControls`), +/- buttons allow moving away from that ideal: you can
 * always go back down to 1 (the whole Earth) or up to the last tier. A different `key`
 * on every round (caller side) remounts the component and resets that choice to the ideal.
 * The true answer (isTruth) only draws as its circled point: no arc, so as to
 * not drown players' answers under its own lines.
 */
export const EarthSection = ({
  size,
  origin,
  marks,
  zoomControls = false,
  allowSatellite = zoomControls,
  forceSide,
}: EarthSectionProps) => {
  const { colors, compass, isDark, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const height = size * HEIGHT_RATIO;
  const baseRadius = size * EARTH_RADIUS_RATIO;
  const player: Point = { x: size / 2, y: size * PLAYER_Y_RATIO };

  const baseCenter: Point = { x: player.x, y: player.y + baseRadius };
  const offsets = marks.map((item) => {
    const end = markEnd(item, baseCenter, baseRadius, forceSide);
    return { x: end.x - player.x, y: end.y - player.y };
  });
  const idealZoom = fitZoom(offsets, size * AVAILABLE_X_RATIO, height - player.y - BOTTOM_MARGIN);
  const idealIndex = ZOOM_STEPS.indexOf(idealZoom as (typeof ZOOM_STEPS)[number]);

  // null = no manual choice: follows the ideal. As soon as +/- is touched, starts from its index.
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const stepIndex = manualIndex ?? idealIndex;
  const zoom = ZOOM_STEPS[stepIndex];

  const radius = baseRadius * zoom;
  const center: Point = { x: player.x, y: player.y + radius };

  // The 3D globe is offered whatever the zoom, as soon as the caller gave the starting point (without it there is nothing to
  // place on a globe), and it is what is shown first: `null` = no choice made yet, which means the globe.
  const [globe, setGlobe] = useState<boolean | null>(null);
  const canFlip = origin !== undefined;
  const globeOrigin = canFlip && (globe ?? true) ? origin : undefined;

  // Orbiting satellite, just for fun: only when `allowSatellite` (Compass reveal,
  // or the always-revealed mini-Earth of Clues' "Distance" clue), zoomed out to
  // the real scale (zoom 1, otherwise off-screen or grotesque).
  const showSatellite = allowSatellite && zoom === 1 && globeOrigin === undefined && isDark;
  const satelliteAngle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!showSatellite) return undefined;
    // Animated.loop() sometimes crashes after a single turn on react-native-web's JS driver
    // (the one used here, since useNativeDriver isn't available on web): so we loop by hand,
    // restarting a timing from 0 on every `finished`, rather than relying on `loop()`.
    let cancelled = false;
    const spin = () => {
      satelliteAngle.setValue(0);
      Animated.timing(satelliteAngle, {
        duration: SATELLITE_ORBIT_MS,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled) spin();
      });
    };
    spin();
    return () => {
      cancelled = true;
      satelliteAngle.stopAnimation();
    };
  }, [showSatellite, satelliteAngle]);

  // Joke on clicking the satellite: stays shown until it's clicked again (see the
  // Pressable below), no automatic disappearance.
  const [showQuip, setShowQuip] = useState(false);

  const mark = (item: EarthMark, key: string) => {
    const side = forceSide ?? sideOf(item.bearing);
    const angle = surfaceAngle(item.distanceKm);
    const end = markEnd(item, center, radius, forceSide);
    const color = item.color;
    const opacity = item.opacity ?? 1;

    return (
      <G key={key} opacity={opacity}>
        {item.isTruth !== true && (
          <Path
            d={arcPath(center, radius, angle, side)}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={3.5}
          />
        )}
        <Circle cx={end.x} cy={end.y} r={5.5} fill={color} stroke={colors.surface} strokeWidth={2} />
        {item.isTruth === true && <Circle cx={end.x} cy={end.y} r={11} fill="none" stroke={color} strokeWidth={2} />}
      </G>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.caption}>{CAPTION_SURFACE.toUpperCase()}</Text>
        <View style={styles.headerActions}>
          {canFlip && (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setGlobe(globeOrigin === undefined)}
              style={styles.viewToggle}
            >
              <Text style={styles.viewToggleLabel}>
                {globeOrigin === undefined ? SWITCH_TO_GLOBE : SWITCH_TO_EARTH}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.svgWrap}>
        {globeOrigin !== undefined ? (
          <View style={[styles.flatWrap, { height }]}>
            <Globe3D equator marks={marks} origin={globeOrigin} size={Math.min(size, height)} />
          </View>
        ) : (
          <Svg accessibilityLabel={CAPTION_SURFACE} height={height} width={size}>
            <Defs>
              <RadialGradient id="earth" cx="50%" cy="40%" r="65%">
                <Stop offset="0%" stopColor={compass.faceInner} />
                <Stop offset="100%" stopColor={compass.faceOuter} />
              </RadialGradient>
            </Defs>

            <Circle cx={center.x} cy={center.y} r={radius} fill="url(#earth)" stroke={colors.border} strokeWidth={3} />
            <Circle
              cx={center.x}
              cy={center.y}
              r={radius * 0.28}
              fill="none"
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="3 5"
            />

            {marks.map((item, index) => mark(item, `mark-${index}`))}

            <Circle cx={player.x} cy={player.y} r={6} fill={colors.text} stroke={colors.surface} strokeWidth={2} />
            <SvgText
              x={player.x}
              y={player.y - 12}
              fill={colors.text}
              fontFamily={typography.heading.fontFamily}
              fontSize={12}
              fontWeight="800"
              textAnchor="middle"
            >
              {PLAYER_LABEL}
            </SvgText>
          </Svg>
        )}

        {showSatellite && (
          <Animated.View
            style={[
              styles.satelliteAnchor,
              {
                left: center.x,
                top: center.y,
                transform: [
                  {
                    rotate: satelliteAngle.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  { translateY: -(radius + SATELLITE_CLEARANCE) },
                ],
              },
            ]}
          >
            {/* No accessibilityRole="button" here: EarthSection can already be inside a real
            button (the "Distance" clue card), and web doesn't accept a nested <button>. */}
            <Pressable hitSlop={10} onPress={() => setShowQuip((v) => !v)}>
              <Text style={styles.satelliteEmoji}>{SATELLITE_EMOJI}</Text>
            </Pressable>
            {showQuip && (
              // Counter-rotates relative to the parent to stay legible regardless of the
              // orbit angle at the moment of the click (same idea as the emoji's former
              // rotation, reused here for the text instead of the satellite itself).
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.quipWrap,
                  {
                    transform: [
                      {
                        rotate: satelliteAngle.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.quipBubble}>
                  <Text style={styles.quipText}>{SATELLITE_QUIP}</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        )}
        {zoomControls && globeOrigin === undefined && (
          <View style={styles.zoomControls}>
            <Pressable
              accessibilityRole="button"
              disabled={stepIndex === 0}
              hitSlop={8}
              onPress={() => setManualIndex(Math.max(0, stepIndex - 1))}
              style={[styles.zoomButton, stepIndex === 0 && { opacity: 0.4 }]}
            >
              <Text style={styles.zoomButtonLabel}>−</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={stepIndex === ZOOM_STEPS.length - 1}
              hitSlop={8}
              onPress={() => setManualIndex(Math.min(ZOOM_STEPS.length - 1, stepIndex + 1))}
              style={[styles.zoomButton, stepIndex === ZOOM_STEPS.length - 1 && { opacity: 0.4 }]}
            >
              <Text style={styles.zoomButtonLabel}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};
