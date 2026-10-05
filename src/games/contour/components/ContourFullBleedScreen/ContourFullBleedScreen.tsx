import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '@/helpers/useKeyboardHeight';
import { useThemedStyles } from '@/themes';

import { boardShapeFor } from '@/games/contour/helpers/roundBoard';
import ContourBoard from '../ContourBoard';
import type { ContourFullBleedScreenProps } from './types';

import { createStyles } from './styles';

/**
 * Silhouette's guess layout, shared by the local and the online game: no `Screen` at all — the
 * country's board fills the entire measured safe area, and the header/footer float on top of it in
 * translucent bands (positioned absolutely, so they don't reserve their own layout space) so the
 * outline can touch the screen's edges. Dumb: the caller measures (`useRoundBoard`) and decides
 * what goes in the bands.
 */
export const ContourFullBleedScreen = ({
  board,
  plan,
  hintsRevealed,
  hintLabels,
  roundKey,
  onBoardAreaLayout,
  onOverlayTopLayout,
  onOverlayBottomLayout,
  boardOverlay,
  header,
  footer,
  children,
}: ContourFullBleedScreenProps) => {
  const styles = useThemedStyles(createStyles);
  // The footer floats from the bottom of the screen: it is lifted by hand above the keyboard, so the answer being typed
  // and its button stay in sight.
  const keyboardHeight = useKeyboardHeight();

  return (
    <SafeAreaView style={styles.fullBleedSafeArea}>
      <View onLayout={onBoardAreaLayout} style={styles.fullBleedBoardArea}>
        <View style={styles.boardFrame}>
          <ContourBoard
            {...boardShapeFor(board, plan, hintsRevealed)}
            height={board.height}
            hintLabels={hintLabels}
            key={roundKey}
            width={board.width}
          />
          {boardOverlay}
        </View>
      </View>

      <View onLayout={onOverlayTopLayout} style={styles.overlayTopPosition}>
        {header}
      </View>

      <View onLayout={onOverlayBottomLayout} style={[styles.overlayBottom, { bottom: keyboardHeight }]}>
        {footer}
      </View>

      {children}
    </SafeAreaView>
  );
};
