import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import { markersInHiddenQuadrants, quadrantRects } from '../../helpers/quadrants';
import { LOCK_EMOJI } from './constants';
import type { ContourQuadrantMaskProps } from './types';

import { createStyles } from './styles';

/**
 * Silhouette's hidden cells — dumb: the board is cut in 2 x 2 equal cells and every hidden one is covered by an opaque
 * panel with a lock, so only what lies in the open cells can be seen (the outline, the neighbors, the markers and the
 * labels alike: this is drawn over all of them). A hidden cell the player may open is a button that says what it costs;
 * for everybody else it is just a lock. A flag revealed behind a hidden cell is marked above it by an accent rectangle
 * (`flagBoxes`), so the players know something is there.
 */
export const ContourQuadrantMask = ({
  width,
  height,
  hidden,
  canReveal,
  costLabel,
  labelFor,
  onReveal,
  flagBoxes = [],
}: ContourQuadrantMaskProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View pointerEvents="box-none" style={styles.mask}>
      {quadrantRects(width, height)
        .filter((rect) => hidden.includes(rect.index))
        .map((rect) => {
          const frame = { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
          return canReveal ? (
            <Pressable
              accessibilityLabel={labelFor(rect.index)}
              accessibilityRole="button"
              key={rect.index}
              onPress={() => onReveal(rect.index)}
              style={[styles.cell, frame]}
            >
              <Text style={styles.lock}>{LOCK_EMOJI}</Text>
              <Text style={styles.cost}>{costLabel}</Text>
            </Pressable>
          ) : (
            <View key={rect.index} style={[styles.cell, frame]}>
              <Text style={styles.lock}>{LOCK_EMOJI}</Text>
            </View>
          );
        })}
      {markersInHiddenQuadrants(flagBoxes, width, height, hidden).map((box, index) => (
        <View
          key={`flag-${index}`}
          pointerEvents="none"
          style={[styles.flagMarker, { left: box.x, top: box.y, width: box.width, height: box.height }]}
        />
      ))}
    </View>
  );
};
