```tsx
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintLabels } from '@/games/contour/helpers/roundBoard';

// Round over: tier 4 shows every flag and name, and the footer carries the result / next round.
<ContourFullBleedScreen
  board={board}
  footer={<Button label={t.contourGame.continueLabel} onPress={goToNextRound} />}
  header={<GameHeader {...headerProps} />}
  hintLabels={buildHintLabels(board, 4, language)}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  roundKey={roundNumber}
/>
```
