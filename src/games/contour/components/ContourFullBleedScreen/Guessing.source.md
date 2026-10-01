```tsx
import GameFooter from '@/components/GameFooter';
import ContourFullBleedScreen from '@/games/contour/components/ContourFullBleedScreen';
import { buildHintPlan } from '@/games/contour/helpers/hintPlan';
import { buildHintLabels } from '@/games/contour/helpers/roundBoard';
import { useRoundBoard } from '@/games/contour/helpers/useRoundBoard';

// `useRoundBoard` measures the area the board fills and fits the country to it (the header/footer
// bands float over the board, their heights are subtracted).
// `simplifySeed` is the round's seed (`roundSimplifySeed`), the same on every device. The plan is the
// round's ordered hint steps: the room's categories + the country, rebuilt on every device.
const plan = buildHintPlan(roomSettings.hintCategories, country);
const { board, onBoardAreaLayout, onOverlayTopLayout, onOverlayBottomLayout } = useRoundBoard(country, true, simplifySeed);

<ContourFullBleedScreen
  board={board}
  footer={
    <GameFooter>
      <ContourGuessBar guessText={guessText} onChangeGuessText={setGuessText} onSubmit={submitGuess} />
    </GameFooter>
  }
  header={<GameHeader {...headerProps} />}
  hintLabels={buildHintLabels(board, plan, hintsRevealed, language)}
  hintsRevealed={hintsRevealed}
  onBoardAreaLayout={onBoardAreaLayout}
  onOverlayBottomLayout={onOverlayBottomLayout}
  onOverlayTopLayout={onOverlayTopLayout}
  plan={plan}
  roundKey={roundNumber}
/>
```
