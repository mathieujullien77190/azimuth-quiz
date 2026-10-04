```tsx
import GameHeader from '@/components/GameHeader';

// Travel mode, rounds after the first: where the player stands (the previous place), in white under the round row.
<GameHeader
  code={roomCode}
  difficulty={difficulty}
  location={t.game.youAreAt('Cusco')}
  name={name}
  onQuit={onQuit}
  points={points}
  roundNumber={roundNumber}
  totalRounds={totalRounds}
/>
```
