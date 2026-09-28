```tsx
import GameFooter from '@/components/GameFooter';
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintLabels, precisionLevel } from '@/games/contour/helpers/roundBoard';
import { useRoundBoard } from '@/games/contour/helpers/useRoundBoard';

// `useRoundBoard` measures the area the board fills and fits the country to it (the header/footer
// bands float over the board, their heights are subtracted).
// `simplifySeed` is the round's seed (`roundSimplifySeed`), the same on every device.
const { board, onBoardAreaLayout, onOverlayTopLayout, onOverlayBottomLayout } = useRoundBoard(country, true, simplifySeed);

<ContourFullBleedScreen
  board={board}
  footer={
    <GameFooter>
      <ContourGuessBar guessText={guessText} onChangeGuessText={setGuessText} onHint={revealHint} onSubmit={submitGuess} />
    </GameFooter>
  }
  header={<GameHeader {...headerProps} />}
  hintLabels={buildHintLabels(board, hintsRevealed, language)}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  precision={precisionLevel(hintsRevealed)}
  roundKey={roundNumber}
/>
```
