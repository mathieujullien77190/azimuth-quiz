```tsx
import GameFooter from '@/components/GameFooter';
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintLabels } from '@/games/contour/helpers/roundBoard';

// Round over: every step of the plan is shown, the country flag and name included (the last step),
// and the footer carries the result / next round.
<ContourFullBleedScreen
  board={board}
  footer={
    <GameFooter>
      <Button label={t.contourGame.continueLabel} onPress={goToNextRound} />
    </GameFooter>
  }
  header={<GameHeader {...headerProps} />}
  hintLabels={buildHintLabels(board, plan, plan.length, language)}
  hintsRevealed={plan.length}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  plan={plan}
  roundKey={roundNumber}
/>
```
