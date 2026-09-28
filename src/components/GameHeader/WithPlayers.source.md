```tsx
import GameHeader from '@/components/GameHeader';

// `players` adds the tabs: everyone in the room, and (`turnIndex`) whose turn it is — -1 between
// rounds, when nobody's is.
<GameHeader
  code={code}
  difficulty={roomSettings.difficulty}
  name={myName}
  onQuit={handleQuit}
  players={onlinePlayers}
  points={gameState.totalScores[localUid] ?? 0}
  roundNumber={gameState.roundIndex + 1}
  totalRounds={gameState.places.length}
  turnIndex={roundOver ? -1 : turnIndex}
/>
```
