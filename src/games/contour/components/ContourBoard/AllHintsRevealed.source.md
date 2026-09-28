```tsx
import ContourBoard from '@/games/contour/components/ContourBoard';
import { buildHintPlan } from '@/games/contour/helpers/hintPlan';
import { buildHintLabels, projectRound } from '@/games/contour/helpers/roundBoard';

// `projectRound` fits the country to the measured area; `buildHintLabels` turns the steps of the round's
// plan that are out into the flags, names and markers drawn on the board (all of them = everything,
// the country's name included).
const board = projectRound(country, maxWidth, maxHeight);
const plan = buildHintPlan(roomSettings.hintCategories, country);

<ContourBoard
  height={board.height}
  hintLabels={buildHintLabels(board, plan, plan.length, language)}
  outline={board.outline}
  width={board.width}
/>
```
