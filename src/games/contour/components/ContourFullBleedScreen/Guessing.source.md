```tsx
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintLabels } from '@/games/contour/helpers/roundBoard';
import { useRoundBoard } from '@/games/contour/helpers/useRoundBoard';

// `useRoundBoard` measures the area the board fills and fits the country to it (the header/footer
// bands float over the board, their heights are subtracted).
const { board, onBoardAreaLayout, onOverlayTopLayout, onOverlayBottomLayout } = useRoundBoard(country, true);

<ContourFullBleedScreen
  board={board}
  footer={<ContourGuessBar guessText={guessText} onChangeGuessText={setGuessText} onHint={revealHint} onSubmit={submitGuess} />}
  header={<GameHeader {...headerProps} />}
  hintLabels={buildHintLabels(board, hintsRevealed, language)}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  roundKey={roundNumber}
/>
```
