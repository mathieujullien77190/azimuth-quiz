```tsx
import ContourBoard from '@/games/contour/components/ContourBoard';
import { boardShapeFor, precisionLevel, projectRound, roundGeometry } from '@/games/contour/helpers/roundBoard';
import { roundSimplifySeed } from '@/games/contour/helpers/simplify';

// The seed is the same on every device of a room: room seed + round + country.
const seed = roundSimplifySeed(room.simplifySeed, roundIndex, country.code);
const board = projectRound(country, maxWidth, maxHeight, roundGeometry(country, seed));

// `precisionLevel(hintsRevealed)`: 0 to 2 = simplified outline (single stroke, no neighbors),
// 3 = the full ring with the neighbors around it and each border drawn once.
<ContourBoard
  height={board.height}
  width={board.width}
  {...boardShapeFor(board, precisionLevel(hintsRevealed))}
/>
```
