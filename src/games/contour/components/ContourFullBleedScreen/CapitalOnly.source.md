```tsx
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintPlan } from '@/games/contour/helpers/hintPlan';
import { buildHintLabels } from '@/games/contour/helpers/roundBoard';

// The room only picked the capital: the plan is capitalPosition, capitalName, reveal. With no
// silhouette hint the country is the full ring from the start; one hint puts the star on the capital.
const plan = buildHintPlan(['capital'], country);

<ContourFullBleedScreen
  board={board}
  footer={footer}
  header={header}
  hintLabels={buildHintLabels(board, plan, 1, language)}
  hintsRevealed={1}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  plan={plan}
  roundKey={roundNumber}
/>
```
