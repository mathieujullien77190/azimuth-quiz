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
  DAY_LAND_COLOR,
  DAY_SEA_COLOR,
  LAND_FILL_OPACITY,
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

/** Le pole nord, comme un lieu quelconque : ce a quoi le label "N" est accroche. */
const NORTH_POLE: Coordinates = { latitude: 90, longitude: 0 };

/**
 * La Terre en vraie boule, dessinee avec three.js sur une surface OpenGL (`expo-gl`) et tournee au doigt : contour du
 * monde, point de depart et route de chaque reponse (cap tenu tout du long, loxodromie). Ce qui passe derriere la
 * boule est cache par la boule elle-meme, tout l'interet du 3D.
 *
 * S'ouvre sur la face ou sont le depart et les reponses, nord en haut. Un doigt tourne, deux zooment, "⌖ N" remet
 * la vue de depart. Les labels ("toi", "N") et le satellite sont des vues posees par-dessus le canvas, placees par la
 * meme projection que la camera (`screenPoint`) pour garder la police de l'app.
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
  // Marge autour du globe pour le satellite qui le survole.
  const baseRadius = (size / 2 - GLOBE_MARGIN) / ORBIT_RATIO;
  const cx = size / 2;
  const cy = size / 2;

  // Les reponses sont souvent construites en ligne par l'appelant (nouveau tableau a chaque rendu) : on reconstruit
  // le globe sur leur contenu, pas sur l'identite du tableau.
  const marksKey = marks
    .map((item) => `${item.bearing}/${item.distanceKm}/${item.color}/${item.isTruth === true}/${item.opacity ?? 1}`)
    .join('|');
  // Ou le globe s'ouvre et ou "⌖ N" le remet : la face ou est tout le monde.
  const home = useMemo(
    () => centerOn([origin, ...marks.map((item) => rhumbDestination(origin, item.bearing, item.distanceKm))]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `marksKey` stands for `marks`, see above.
    [origin.latitude, origin.longitude, marksKey],
  );
  const [center, setCenter] = useState<Coordinates>(home);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const radius = baseRadius * zoom;

  const sceneColors = useMemo(
    () =>
      isDark
        ? {
            // Nuit : la mer est la couleur de la boule, les continents sont peints par-dessus de la couleur de leur cote,
            // trace en ligne au-dessus.
            globe: compass.faceInner,
            land: colors.textMuted,
            fill: colors.textMuted,
            fillOpacity: LAND_FILL_OPACITY,
            flat: false,
            guide: colors.textMuted,
            origin: colors.text,
            pole: colors.text,
          }
        : {
            // Jour : la mer est le sable du fond de l'app, sur fond blanc pour faire ressortir la boule ; continents en
            // bleu clair plein, cote en bleu d'accent.
            globe: DAY_SEA_COLOR,
            land: colors.accent,
            fill: DAY_LAND_COLOR,
            fillOpacity: 1,
            flat: true,
            guide: colors.textMuted,
            origin: colors.text,
            pole: colors.text,
          },
    [isDark, compass.faceInner, colors.accent, colors.textMuted, colors.text],
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
  // Les routes sont construites a part de la boule : l'epaisseur d'un tube ne se change pas par mise a l'echelle,
  // donc le zoom les reconstruit (elles seules) pour garder leur largeur a l'ecran, comme les pastilles.
  const routes = useMemo(
    () => buildRoutes(origin, marks, ROUTE_THICKNESS / zoom),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `marksKey` stands for `marks`, see above.
    [origin.latitude, origin.longitude, marksKey, zoom],
  );
  // La carte graphique garde chaque boule construite tant qu'on ne la libere pas.
  useEffect(() => () => disposeScene(view.scene), [view]);
  useEffect(() => () => disposeScene(routes), [routes]);

  const onContextCreate = useGlobeRenderer({
    ...view,
    routes,
    center,
    halfExtent: size / (2 * radius),
    markScale: 1 / zoom,
    // Fond du dessin : le fond de l'ecran la nuit, blanc le jour (la mer est couleur sable).
    background: backgroundColor ?? (isDark ? colors.background : colors.surface),
  });

  // Un doigt tourne le globe (la surface suit le doigt), deux doigts zooment.
  //
  // Tout se mesure depuis la position actuelle des doigts contre leur position au move precedent, jamais depuis le
  // cumul du geste : rien ne se reporte d'un geste a l'autre, et un move parasite apres le lache (le web en envoie
  // un) ne ramene pas le globe au depart. `null` = aucun doigt.
  const last = useRef<Fingers | null>(null);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Le geste reste au globe jusqu'au lache : ni la page dessous (defilement) ni une vue native autour ne le reprend.
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

  // Le satellite fait le tour de la boule sur son equateur (devant puis derriere, voir `orbitPoint`), seulement
  // sans zoom : sinon il sortirait du dessin.
  const angle = useOrbitAngle(ORBIT_MS, ORBIT_TICK_MS);
  const satellite =
    !withSatellite || !isDark || zoom !== MIN_ZOOM ? undefined : orbitPoint(angle, center, cx, cy, radius, ORBIT_RATIO);

  const start = screenPoint(origin, center, cx, cy, radius);
  const pole = screenPoint(NORTH_POLE, center, cx, cy, radius);

  return (
    <View
      accessibilityLabel={CAPTION_GLOBE}
      // Web : sans ca, le navigateur defile la page sous le doigt qui tourne le globe (`noPageScroll`).
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
          {/* Comme le satellite de la vue Terre : un tap affiche une blague, un second la masque. */}
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
