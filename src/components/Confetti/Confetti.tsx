import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { PLAYER_COLORS } from '@/constants';
import { useTheme } from '@/themes';

import { DURATION_MS, PIECE_COUNT, SEED, TICK_MS } from './constants';
import { buildPieces, pieceTransform } from './helpers';

// zIndex/elevation pour passer devant le ScrollView du Screen (Confetti est rendu dans le
// slot `header`, donc avant le contenu scrollable dans l'ordre des enfants).
const styles = StyleSheet.create({
  front: {
    zIndex: 10,
    elevation: 10,
  },
});

/**
 * Pluie de confettis en boucle, purement decorative (pointerEvents none). Meme technique que
 * ThemeBackdrop pour l'animation : un seul etat "temps ecoule" pousse par un `setInterval`, pas
 * d'Animated (qui force `collapsable` sur le web et fait rejeter l'attribut par react-native-svg).
 */
export const Confetti = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const palette = useMemo(() => [...PLAYER_COLORS, colors.accent, colors.truth], [colors.accent, colors.truth]);
  const pieces = useMemo(() => buildPieces(PIECE_COUNT, SEED, palette), [palette]);
  // 0 au premier rendu (export statique compris, pas de decalage d'hydratation), incremente
  // ensuite via un minuteur cote client uniquement.
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= DURATION_MS) {
        clearInterval(id);
        return;
      }
      setElapsedMs(elapsed);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  if (elapsedMs >= DURATION_MS) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.front]}>
      <Svg height={height} width={width}>
        {pieces.map((piece, index) => {
          const { x, y, rotation } = pieceTransform(piece, elapsedMs, width, height);
          const transform = `rotate(${rotation} ${x} ${y})`;
          return <Circle key={index} cx={x} cy={y} fill={piece.color} r={piece.size / 2} transform={transform} />;
        })}
      </Svg>
    </View>
  );
};
