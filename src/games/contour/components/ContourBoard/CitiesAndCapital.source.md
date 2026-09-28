```tsx
import ContourBoard from '@/games/contour/components/ContourBoard';
import { buildHintPlan } from '@/games/contour/helpers/hintPlan';
import { boardShapeFor, buildHintLabels, projectRound } from '@/games/contour/helpers/roundBoard';

// The board projects the country's cities (`cityMarks`) and capital (`capitalMark`) with the same
// projector as its outline. The plan of a cities + capital game is cityPositions, cityNames,
// capitalPosition, capitalName, reveal: 2 hints put the dots, 4 hints add every name.
const board = projectRound(country, maxWidth, maxHeight);
const plan = buildHintPlan(['cities', 'capital'], country);

<ContourBoard
  height={board.height}
  hintLabels={buildHintLabels(board, plan, 4, language)}
  width={board.width}
  {...boardShapeFor(board, plan, 4)}
/>
```
