```tsx
import ContourBoard from '@/games/contour/components/ContourBoard';
import { buildHintLabels, projectRound } from '@/games/contour/helpers/roundBoard';

// `projectRound` fits the country to the measured area; `buildHintLabels` turns a tier (0-4) into
// the flags and names drawn on the board (4 = everything, name included).
const board = projectRound(country, maxWidth, maxHeight);

<ContourBoard
  height={board.height}
  hintLabels={buildHintLabels(board, 4, language)}
  outline={board.outline}
  width={board.width}
/>
```
