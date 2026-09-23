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
    // Point d'ancrage sans taille au centre de la Terre : la rotation puis le translateY qui
    // suivent placent le satellite en orbite, sans affecter sa propre position de centrage.
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
  });

/**
 * La Terre vue de cote, le joueur tout en haut. Chaque reponse part du cote de son cap
 * (cap a l'ouest = a gauche, cap a l'est = a droite) et se dessine en un arc qui suit le cercle
 * (distance de surface). En mode ligne droite, une corde rejoint en plus le meme point d'arrivee :
 * l'inclinaison choisie fixe a la fois l'arc et la corde, la distance de surface n'est qu'une indication.
 * Le cercle zoome en continu sur son sommet pour que les reperes proches restent lisibles : plus
 * les distances de `marks` sont courtes, plus le zoom "ideal" (`fitZoom`) monte, parmi `ZOOM_STEPS`.
 * A la revelation (`zoomControls`), des boutons +/- permettent de s'ecarter de cet ideal : on peut
 * toujours redescendre jusqu'a 1 (la Terre entiere) ou monter jusqu'au dernier palier. Un `key`
 * different a chaque manche (cote appelant) remonte le composant et remet ce choix a l'ideal.
 * La vraie reponse (isTruth) ne se dessine que par son point cercle : pas d'arc ni de corde, pour
 * ne pas noyer les reponses des joueurs sous ses propres traits.
 */
export const EarthSection = ({ size, marks, showStraightLine, zoomControls = false }: EarthSectionProps) => {
  const { colors, compass, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const height = size * HEIGHT_RATIO;
  const baseRadius = size * EARTH_RADIUS_RATIO;
  const player: Point = { x: size / 2, y: size * PLAYER_Y_RATIO };

  const baseCenter: Point = { x: player.x, y: player.y + baseRadius };
  const offsets = marks.map((item) => {
    const end = markEnd(item, baseCenter, baseRadius);
    return { x: end.x - player.x, y: end.y - player.y };
  });
  const idealZoom = fitZoom(offsets, size * AVAILABLE_X_RATIO, height - player.y - BOTTOM_MARGIN);
  const idealIndex = ZOOM_STEPS.indexOf(idealZoom as (typeof ZOOM_STEPS)[number]);

  // null = pas de choix manuel : on suit l'ideal. Des qu'on touche +/-, on part de son index.
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const stepIndex = manualIndex ?? idealIndex;
  const zoom = ZOOM_STEPS[stepIndex];

  const radius = baseRadius * zoom;
  const center: Point = { x: player.x, y: player.y + radius };
  const horizonReach = Math.min(radius * 1.15, size * 0.32);

  // Satellite en orbite, juste pour rigoler : uniquement a la revelation, en mode distance (pas
  // ligne droite), dezoome a l'echelle reelle (zoom 1, sinon hors champ ou grotesque).
  const showSatellite = zoomControls && !showStraightLine && zoom === 1;
  const satelliteAngle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!showSatellite) return undefined;
    // Animated.loop() plante parfois apres un seul tour sur le driver JS de react-native-web
    // (celui utilise ici, faute de useNativeDriver dispo sur web) : on boucle donc a la main,
    // en relancant un timing depuis 0 a chaque `finished`, plutot que de compter sur `loop()`.
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

  const mark = (item: EarthMark, key: string) => {
    const side = sideOf(item.bearing);
    const angle = surfaceAngle(item.distanceKm);
    const end = markEnd(item, center, radius);
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
            pointerEvents="none"
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
            <Text style={styles.satelliteEmoji}>{SATELLITE_EMOJI}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};
