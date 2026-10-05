```tsx
import ContourQuadrantMask from '@/games/contour/components/ContourQuadrantMask';
import { flagRects } from '@/games/contour/helpers/roundBoard';

// A neighbor's flag lying behind a hidden cell is marked above it by an accent rectangle (50 % opacity) in the same
// box as the flag, so the players know something is there; a flag in an open cell is just drawn by the board.
<ContourQuadrantMask
  canReveal={isMyTurn}
  costLabel="−61 pts"
  flagBoxes={flagRects(board, plan, hintsRevealed)}
  height={board.height}
  hidden={hiddenQuadrants(start, quadrantsRevealed)}
  labelFor={(index) => `Dévoiler le carré ${index + 1}`}
  onReveal={revealQuadrant}
  width={board.width}
/>
```
