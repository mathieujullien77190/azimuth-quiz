import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { USE_NATIVE_DRIVER } from '@/helpers';

import Globe3D from '@/components/geo/Globe3D';
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
 * La Terre vue de profil, le joueur tout en haut. Chaque reponse part du cote de son cap
 * (ouest = gauche, est = droite) et trace un arc le long du cercle (distance de surface).
 * Le zoom suit `fitZoom` sur les `marks`, parmi `ZOOM_STEPS` ; avec `zoomControls`, +/- permettent
 * de s'en ecarter. Une `key` differente par manche (cote appelant) remet le choix a l'ideal.
 * La vraie reponse (isTruth) n'est qu'un point entoure, sans arc.
 */
export const EarthSection = ({ size, origin, marks, zoomControls = false }: EarthSectionProps) => {
  const { colors, compass, isDark, typography } = useTheme();
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

  // null = pas de choix manuel : suit l'ideal. Au premier +/-, part de son index.
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const stepIndex = manualIndex ?? idealIndex;
  const zoom = ZOOM_STEPS[stepIndex];

  const radius = baseRadius * zoom;
  const center: Point = { x: player.x, y: player.y + radius };

  // Globe 3D propose a tout zoom des que l'appelant donne le depart, et montre en premier (`null` = pas encore choisi).
  const [globe, setGlobe] = useState<boolean | null>(null);
  const canFlip = origin !== undefined;
  const globeOrigin = canFlip && (globe ?? true) ? origin : undefined;

  // Satellite pour le fun : seulement avec les boutons de zoom (revelation), a l'echelle reelle (zoom 1).
  const showSatellite = zoomControls && zoom === 1 && globeOrigin === undefined && isDark;
  const satelliteAngle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!showSatellite) return undefined;
    // Animated.loop() plante parfois apres un tour avec le driver JS de react-native-web :
    // on boucle a la main, en relancant un timing a chaque `finished`.
    let cancelled = false;
    const spin = () => {
      satelliteAngle.setValue(0);
      Animated.timing(satelliteAngle, {
        duration: SATELLITE_ORBIT_MS,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: USE_NATIVE_DRIVER,
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

  // Blague au clic sur le satellite : reste affichee jusqu'au clic suivant.
  const [showQuip, setShowQuip] = useState(false);

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
            <Globe3D marks={marks} origin={globeOrigin} size={Math.min(size, height)} />
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
            {/* Pas d'accessibilityRole="button" : EarthSection peut etre dans un vrai bouton,
            et le web refuse un <button> imbrique. */}
            <Pressable hitSlop={10} onPress={() => setShowQuip((v) => !v)}>
              <Text style={styles.satelliteEmoji}>{SATELLITE_EMOJI}</Text>
            </Pressable>
            {showQuip && (
              // Contre-rotation par rapport au parent pour rester lisible quel que soit l'angle d'orbite.
              <Animated.View
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
