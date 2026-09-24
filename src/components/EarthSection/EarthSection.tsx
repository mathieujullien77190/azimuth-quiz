import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { fontSize, spacing } from '@/constants';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import {
  AVAILABLE_X_RATIO,
  BOTTOM_MARGIN,
  CAPTION_STRAIGHT,
  CAPTION_SURFACE,
  EARTH_RADIUS_RATIO,
  HEIGHT_RATIO,
  HORIZON_LABEL,
  PLAYER_LABEL,
  PLAYER_Y_RATIO,
  SATELLITE_CLEARANCE,
  SATELLITE_EMOJI,
  SATELLITE_ORBIT_MS,
  SATELLITE_QUIP,
  ZOOM_STEPS,
} from './constants';
import { arcPath, fitZoom, markEnd, sideOf, surfaceAngle } from './helpers';
import type { EarthMark, EarthSectionProps, Point } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginBottom: spacing.xs,
    },
    caption: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    zoomControls: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    zoomButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
    },
    zoomButtonLabel: {
      fontSize: fontSize.body,
      lineHeight: fontSize.body,
      color: colors.text,
      fontWeight: '700',
    },
    svgWrap: {
      position: 'relative',
    },
    // Sizeless anchor point at the center of the Earth: the rotation then translateY that
    // follow place the satellite in orbit, without affecting its own centering position.
    satelliteAnchor: {
      position: 'absolute',
      width: 0,
      height: 0,
    },
    satelliteEmoji: {
      width: 20,
      height: 20,
      marginLeft: -10,
      marginTop: -10,
      fontSize: 16,
      textAlign: 'center',
      textAlignVertical: 'center',
      transform: [{ rotate: '-35deg' }],
    },
    // Counter-rotates relative to the orbit (see satelliteAngle) to stay legible regardless
    // of the satellite's angle at the moment of the click, rather than rotating with it.
    quipWrap: {
      position: 'absolute',
      left: 14,
      top: -14,
      width: 132,
    },
    quipBubble: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: 10,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs + 2,
    },
    quipText: {
      ...typography.body,
      color: colors.accent,
      fontSize: 10,
      textAlign: 'center',
    },
  });

/**
 * The Earth seen from the side, the player at the very top. Each answer starts from the side of
 * its heading (heading west = left, heading east = right) and draws as an arc following the circle
 * (surface distance). In straight-line mode, a chord also joins the same endpoint:
 * the chosen inclination fixes both the arc and the chord, the surface distance is only indicative.
 * The circle zooms continuously on its apex so nearby markers stay legible: the shorter
 * `marks`' distances are, the higher the "ideal" zoom (`fitZoom`) climbs, among `ZOOM_STEPS`.
 * On reveal (`zoomControls`), +/- buttons allow moving away from that ideal: you can
 * always go back down to 1 (the whole Earth) or up to the last tier. A different `key`
 * on every round (caller side) remounts the component and resets that choice to the ideal.
 * The true answer (isTruth) only draws as its circled point: no arc or chord, so as to
 * not drown players' answers under its own lines.
 */
export const EarthSection = ({
  size,
  marks,
  showStraightLine,
  zoomControls = false,
  allowSatellite = zoomControls,
  forceSide,
}: EarthSectionProps) => {
  const { colors, compass, typography } = useTheme();
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
  const horizonReach = Math.min(radius * 1.15, size * 0.32);

  // Orbiting satellite, just for fun: only when `allowSatellite` (Boussole reveal,
  // or the always-revealed mini-Earth of Indices' "Distance" clue), zoomed out to
  // the real scale (zoom 1, otherwise off-screen or grotesque) — regardless of the mode.
  const showSatellite = allowSatellite && zoom === 1;
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
        {!showStraightLine && item.isTruth !== true && (
          <Path
            d={arcPath(center, radius, angle, side)}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={3.5}
          />
        )}
        {showStraightLine && item.isTruth !== true && (
          <Line
            x1={player.x}
            y1={player.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeDasharray="2 5"
            strokeLinecap="round"
            strokeWidth={2}
          />
        )}
        <Circle cx={end.x} cy={end.y} r={5.5} fill={color} stroke={colors.background} strokeWidth={2} />
        {item.isTruth === true && <Circle cx={end.x} cy={end.y} r={11} fill="none" stroke={color} strokeWidth={2} />}
      </G>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.caption}>{(showStraightLine ? CAPTION_STRAIGHT : CAPTION_SURFACE).toUpperCase()}</Text>
        {zoomControls && (
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

      <View style={styles.svgWrap}>
        <Svg accessibilityLabel={CAPTION_STRAIGHT} height={height} width={size}>
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

          {showStraightLine && (
            <>
              <Line
                x1={player.x - horizonReach}
                y1={player.y}
                x2={player.x + horizonReach}
                y2={player.y}
                stroke={colors.textMuted}
                strokeWidth={1.5}
                strokeDasharray="4 5"
              />
              <SvgText
                x={player.x + horizonReach}
                y={player.y - 6}
                fill={colors.textMuted}
                fontFamily={typography.body.fontFamily}
                fontSize={11}
                textAnchor="end"
              >
                {HORIZON_LABEL}
              </SvgText>
            </>
          )}

          {marks.map((item, index) => mark(item, `mark-${index}`))}

          <Circle cx={player.x} cy={player.y} r={6} fill={colors.text} stroke={colors.background} strokeWidth={2} />
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
      </View>
    </View>
  );
};
