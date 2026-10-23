import { useMemo, useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
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
import { styles } from './styles';

// Reference stable : sinon la memoisation du cadran casse a chaque rendu.
const NO_NEEDLES: CompassNeedle[] = [];

export const Compass = ({ size, needles = NO_NEEDLES, truthBearing = null, live = false, onChange }: CompassProps) => {
  const { colors } = useTheme();
  const t = useTranslation();
  const interactive = onChange !== undefined;

  // Le cadran tourne de -heading pour que N reste au vrai nord.
  const { heading, onTouch } = useHeading(live);
  const headingRef = useRef(0);
  headingRef.current = heading ?? 0;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onTouchRef = useRef(onTouch);
  onTouchRef.current = onTouch;
  // Dernier cap envoye, mis a jour tout de suite dans `update` : deux touchmove sur le meme degre
  // avant le rendu sont ainsi dedupliques.
  const bearingRef = useRef(needles[0]?.bearing ?? null);
  bearingRef.current = needles[0]?.bearing ?? null;

  const panResponder = useMemo(() => {
    const update = (x: number, y: number) => {
      // Angle a l'ecran, reconverti dans le repere du cadran (nord = 0).
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
        // Web : demarre le capteur au 1er toucher (geste requis par iOS Safari).
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
        // Web : sans ca, un glisser vertical fait aussi defiler le ScrollView parent.
        interactive && Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle),
      ]}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <View pointerEvents="none" style={heading !== null ? { transform: [{ rotate: `${-heading}deg` }] } : undefined}>
        <CompassDial needles={needles} size={size} truthBearing={truthBearing} />
      </View>

      {heading !== null && (
        // Repere fixe : le haut du telephone, contre lequel le cadran tourne.
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
