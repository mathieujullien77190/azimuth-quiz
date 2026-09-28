```tsx
import GameFooter from '@/components/GameFooter';
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintLabels } from '@/games/contour/helpers/roundBoard';

// Round over: the full ring and tier 7 show every flag and name, and the footer carries the result / next round.
<ContourFullBleedScreen
  board={board}
  footer={
    <GameFooter>
      <Button label={t.contourGame.continueLabel} onPress={goToNextRound} />
    </GameFooter>
  }
  header={<GameHeader {...headerProps} />}
  hintLabels={buildHintLabels(board, 7, language)}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  roundKey={roundNumber}
/>
```
