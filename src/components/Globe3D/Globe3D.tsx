import { GLView } from 'expo-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';

import { PLAYER_LABEL, SATELLITE_EMOJI, SATELLITE_QUIP } from '@/components/EarthSection/constants';
import { rhumbDestination } from '@/helpers/geo';
import { useTheme, useThemedStyles } from '@/themes';
import type { Coordinates } from '@/types';

import {
  CAPTION_GLOBE,
  GLOBE_MARGIN,
  LABEL_OFFSET,
  MIN_ZOOM,
  ORBIT_MS,
  ORBIT_RATIO,
  ORBIT_TICK_MS,
  RESET_HINT,
  RESET_LABEL,
  ZOOM_IN_HINT,
  ZOOM_IN_LABEL,
  ZOOM_OUT_HINT,
  ZOOM_OUT_LABEL,
  ZOOM_STEP,
} from './constants';
import { centerOn, dragCenter, fingerGap, orbitPoint, screenPoint, zoomedBy } from './helpers';
import { buildGlobeScene, disposeScene } from './scene';
import { createStyles } from './styles';
import type { Globe3DProps } from './types';
import { useGlobeRenderer } from './useGlobeRenderer';
import { useOrbitAngle } from './useOrbitAngle';

/** The north pole, as a place like any other: what the "N" label is pinned to. */
const NORTH_POLE: Coordinates = { latitude: 90, longitude: 0 };

/**
 * The Earth as a real ball, drawn with three.js on an OpenGL surface (`expo-gl`) and turned with a finger: the world's
 * outline, the starting point and each answer's route — the way it goes holding its heading all along (rhumb line) —
 * laid on the sphere. What passes behind the globe is hidden by the globe itself, which is the whole point of drawing
 * it in 3D.
 *
 * It opens on the side of the Earth where the starting point and the answers are, north up. A finger turns it, two
 * fingers zoom, and the "⌖ N" button puts it back where it started. The labels ("toi", "N") and the satellite are
 * plain views laid over the canvas, placed by the same projection as the camera's (`screenPoint`), so they keep the
 * app's own font.
 */
export const Globe3D = ({
  size,
  origin,
  marks,
  land: showLand = true,
  north = true,
  equator = false,
  greenwich = false,
  satellite: withSatellite = true,
  draggable = true,
  controls = draggable,
  backgroundColor,
}: Globe3DProps) => {
  const { colors, compass, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [showQuip, setShowQuip] = useState(false);
  // Room around the globe for the satellite, which flies above it.
  const baseRadius = (size / 2 - GLOBE_MARGIN) / ORBIT_RATIO;
  const cx = size / 2;
  const cy = size / 2;

  // The answers are usually built inline by the caller, so a fresh array every render: what the globe is rebuilt on is
  // what they say, not which array says it (rebuilding the ball and its coastlines per render would be a waste).
  const marksKey = marks
    .map((item) => `${item.bearing}/${item.distanceKm}/${item.color}/${item.isTruth === true}/${item.opacity ?? 1}`)
    .join('|');
  // Where the globe opens, and where the "⌖ N" button puts it back: the side where everything is.
  const home = useMemo(
    () => centerOn([origin, ...marks.map((item) => rhumbDestination(origin, item.bearing, item.distanceKm))]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `marksKey` stands for `marks`, see above.
    [origin.latitude, origin.longitude, marksKey],
  );
  const [center, setCenter] = useState<Coordinates>(home);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const radius = baseRadius * zoom;

  const sceneColors = useMemo(
    () => ({
      globe: compass.faceInner,
      land: colors.textMuted,
      guide: colors.textMuted,
      origin: colors.text,
      pole: colors.text,
    }),
    [compass.faceInner, colors.textMuted, colors.text],
  );
  const view = useMemo(
    () =>
      buildGlobeScene({
        origin,
        marks,
        land: showLand,
        equator,
        greenwich,
        north,
        colors: sceneColors,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `marksKey` stands for `marks`, see above.
    [origin.latitude, origin.longitude, marksKey, showLand, equator, greenwich, north, sceneColors],
  );
  // The graphics card keeps every ball ever built until it is told otherwise.
  useEffect(() => () => disposeScene(view.scene), [view]);

  const onContextCreate = useGlobeRenderer({
    ...view,
    center,
    halfExtent: size / (2 * radius),
    background: backgroundColor ?? colors.background,
  });

  // One finger turns the globe (the surface follows the finger), two fingers zoom. Each move only adds what is new
  // since the previous one, so a gesture never jumps when it goes from two fingers back to one.
  const last = useRef({ dx: 0, dy: 0, gap: null as number | null });
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          last.current = { dx: 0, dy: 0, gap: null };
        },
        onPanResponderMove: (event, gesture) => {
          const gap = fingerGap(event.nativeEvent.touches);
          const previous = last.current;
          const previousGap = previous.gap;
          last.current = { dx: gesture.dx, dy: gesture.dy, gap };
          if (gap !== null) {
            if (previousGap !== null) setZoom((current) => zoomedBy(current, gap / previousGap));
            return;
          }
          setCenter((current) => dragCenter(current, gesture.dx - previous.dx, gesture.dy - previous.dy, radius));
        },
      }),
    [radius],
  );

  // The satellite goes right round the Earth on the way from the starting point to the answer (the true one when there
  // is one), behind the globe too. Only unzoomed: it would fly off the drawing.
  const angle = useOrbitAngle(ORBIT_MS, ORBIT_TICK_MS);
  const guide = marks.find((item) => item.isTruth === true) ?? marks[0];
  const satellite =
    !withSatellite || !isDark || guide === undefined || zoom !== MIN_ZOOM
      ? undefined
      : orbitPoint(origin, guide.bearing, angle, center, cx, cy, radius, ORBIT_RATIO);

  const start = screenPoint(origin, center, cx, cy, radius);
  const pole = screenPoint(NORTH_POLE, center, cx, cy, radius);

  return (
    <View
      accessibilityLabel={CAPTION_GLOBE}
      style={[styles.wrap, { width: size, height: size }]}
      {...(draggable ? pan.panHandlers : {})}
    >
      <GLView onContextCreate={onContextCreate} style={{ width: size, height: size }} />

      {start.visible && (
        <Text style={[styles.label, { left: start.x - size / 2, top: start.y - LABEL_OFFSET, width: size }]}>
          {PLAYER_LABEL}
        </Text>
      )}
      {north && pole.visible && (
        <Text style={[styles.poleLabel, { left: pole.x + LABEL_OFFSET / 2, top: pole.y - LABEL_OFFSET }]}>N</Text>
      )}

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

      {controls && (
        <View style={styles.controls}>
          <Pressable
            accessibilityLabel={ZOOM_IN_HINT}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => setZoom((current) => zoomedBy(current, ZOOM_STEP))}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>{ZOOM_IN_LABEL}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={ZOOM_OUT_HINT}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => setZoom((current) => zoomedBy(current, 1 / ZOOM_STEP))}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>{ZOOM_OUT_LABEL}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={RESET_HINT}
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => {
              setCenter(home);
              setZoom(MIN_ZOOM);
            }}
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>{RESET_LABEL}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
