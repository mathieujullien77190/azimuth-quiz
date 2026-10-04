import { GLView } from 'expo-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';

import { PLAYER_LABEL, SATELLITE_EMOJI, SATELLITE_QUIP } from '@/components/EarthSection/constants';
import { rhumbDestination } from '@/helpers/geo';
import { noPageScroll } from '@/helpers/web';
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
  ROUTE_THICKNESS,
  RESET_LABEL,
  ZOOM_IN_HINT,
  ZOOM_IN_LABEL,
  ZOOM_OUT_HINT,
  ZOOM_OUT_LABEL,
  ZOOM_STEP,
} from './constants';
import { centerOn, dragCenter, fingersOf, orbitPoint, screenPoint, zoomedBy } from './helpers';
import { buildGlobeScene, buildRoutes, disposeScene } from './scene';
import { createStyles } from './styles';
import type { Fingers, Globe3DProps } from './types';
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
      // The sea is the ball's own colour; the continents are painted over it in the colour of their own coast (a
      // map's way of telling land from sea), with that coast drawn as a line on top.
      globe: compass.faceInner,
      land: colors.textMuted,
      fill: colors.textMuted,
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
  // The answers' routes are built apart from the ball: a tube cannot be thinned by scaling it, so the zoom rebuilds
  // them (and them alone) to keep them the width they have on screen unzoomed, like the dots.
  const routes = useMemo(
    () => buildRoutes(origin, marks, ROUTE_THICKNESS / zoom),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `marksKey` stands for `marks`, see above.
    [origin.latitude, origin.longitude, marksKey, zoom],
  );
  // The graphics card keeps every ball ever built until it is told otherwise.
  useEffect(() => () => disposeScene(view.scene), [view]);
  useEffect(() => () => disposeScene(routes), [routes]);

  const onContextCreate = useGlobeRenderer({
    ...view,
    routes,
    center,
    halfExtent: size / (2 * radius),
    markScale: 1 / zoom,
    background: backgroundColor ?? colors.background,
  });

  // One finger turns the globe (the surface follows the finger), two fingers zoom.
  //
  // Everything is measured from where the fingers are *now* against where they were at the previous move, never from
  // what a gesture has added up so far: a gesture then carries nothing over from the one before it, and a stray move
  // reported once the finger is already gone (the web does that on release) cannot send the globe back where it
  // started. `null` = no finger on the glass.
  const last = useRef<Fingers | null>(null);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // The gesture belongs to the globe until the finger is lifted: neither the page under it (scrolling while one
        // turns the globe) nor a native view around it takes it away.
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (event) => {
          last.current = fingersOf(event.nativeEvent);
        },
        onPanResponderMove: (event, gesture) => {
          const previous = last.current;
          if (gesture.numberActiveTouches === 0 || previous === null) return;
          const now = fingersOf(event.nativeEvent);
          const spread = now.gap;
          const spreadBefore = previous.gap;
          last.current = now;
          if (spread !== null) {
            if (spreadBefore !== null) setZoom((current) => zoomedBy(current, spread / spreadBefore));
            return;
          }
          setCenter((current) => dragCenter(current, now.x - previous.x, now.y - previous.y, radius));
        },
        onPanResponderRelease: () => {
          last.current = null;
        },
        onPanResponderTerminate: () => {
          last.current = null;
        },
      }),
    [radius],
  );

  // The satellite goes right round the ball along its equator — over the ball and then behind it (see `orbitPoint`).
  // Only unzoomed: it would fly off the drawing.
  const angle = useOrbitAngle(ORBIT_MS, ORBIT_TICK_MS);
  const satellite =
    !withSatellite || !isDark || zoom !== MIN_ZOOM ? undefined : orbitPoint(angle, center, cx, cy, radius, ORBIT_RATIO);

  const start = screenPoint(origin, center, cx, cy, radius);
  const pole = screenPoint(NORTH_POLE, center, cx, cy, radius);

  return (
    <View
      accessibilityLabel={CAPTION_GLOBE}
      // On the web the browser would scroll the page under the finger that turns the globe (`noPageScroll`).
      style={[styles.wrap, { width: size, height: size }, noPageScroll()]}
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
