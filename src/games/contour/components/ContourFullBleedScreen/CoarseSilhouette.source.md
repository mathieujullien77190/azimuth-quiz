```tsx
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintLabels, precisionLevel } from '@/games/contour/helpers/roundBoard';

// Tier 0: `precisionLevel(0)` is 0, the coarsest outline (about 10 vertices, drawn from the round's
// seed) with no neighbor around it. Tiers 1 to 3 refine it up to the full ring; the labels only
// start at tier 4.
<ContourFullBleedScreen
  board={board}
  footer={footer}
  header={header}
  hintLabels={buildHintLabels(board, 0, language)}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  precision={precisionLevel(0)}
  roundKey={roundNumber}
/>
```
