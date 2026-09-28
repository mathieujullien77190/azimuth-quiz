```tsx
import ContourBoard from '@/games/contour/components/ContourBoard';
import { projectRound } from '@/games/contour/helpers/roundBoard';

// `projectRound` projects the country and, with it, the countries that touch it (`neighborOutlines`)
// and its outline cut into coast and shared borders (`coastlines`, `borders`) — all in the same frame.
const board = projectRound(country, maxWidth, maxHeight);

// Neighbors are filled without a stroke, then the country, then the two lines on top: a border
// shared with a neighbor is drawn once, by the country's side.
<ContourBoard
  borders={board.borders}
  coastlines={board.coastlines}
  height={board.height}
  neighborOutlines={board.neighborOutlines}
  outline={board.outline}
  width={board.width}
/>
```
