```tsx
import ContourQuadrantMask from '@/games/contour/components/ContourQuadrantMask';

// Laid over the country's board (the `boardOverlay` of ContourFullBleedScreen): the board is cut in 2 x 2 cells,
// every cell in `hidden` is covered. The turn-holder can tap one to open it, at a cost in points.
<ContourQuadrantMask
  canReveal={isMyTurn}
  costLabel="−61 pts"
  height={board.height}
  hidden={hiddenQuadrants(start, quadrantsRevealed)}
  labelFor={(index) => `Dévoiler le carré ${index + 1}`}
  onReveal={revealQuadrant}
  width={board.width}
/>
```
