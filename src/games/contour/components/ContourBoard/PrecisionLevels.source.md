```tsx
import ContourBoard from '@/games/contour/components/ContourBoard';
import { buildHintPlan } from '@/games/contour/helpers/hintPlan';
import { boardShapeFor, projectRound, roundGeometry } from '@/games/contour/helpers/roundBoard';
import { roundSimplifySeed } from '@/games/contour/helpers/simplify';

// The seed is the same on every device of a room: room seed + round + country.
const seed = roundSimplifySeed(room.simplifySeed, roundIndex, country.code);
const board = projectRound(country, maxWidth, maxHeight, roundGeometry(country, seed));

// The plan lists the hint steps of the round; with the silhouette hints on, the first three refine
// the outline: 0 to 2 hints = the outline at that precision (single stroke, no neighbors), 3 = the
// full ring. The neighbors' shapes come with a later step of the plan.
const plan = buildHintPlan(roomSettings.hintCategories, country);
<ContourBoard
  height={board.height}
  width={board.width}
  {...boardShapeFor(board, plan, hintsRevealed)}
/>
```
