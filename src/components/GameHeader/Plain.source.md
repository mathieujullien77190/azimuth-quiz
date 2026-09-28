```tsx
import GameHeader from '@/components/GameHeader';

// No `players`, no `question`: just the cross and code, the name and points, and the round line.
<GameHeader
  code={code}
  difficulty={roomSettings.difficulties[0]}
  name={myName}
  onQuit={handleQuit}
  points={totals[myIndex] ?? 0}
  roundNumber={gameState.roundIndex + 1}
  totalRounds={gameState.places.length}
/>
```
