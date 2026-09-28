```tsx
import GameHeader from '@/components/GameHeader';

// `question` sits centered at the bottom of the header; leave it out once the round is over.
<GameHeader
  code={code}
  difficulty={roomSettings.difficulty}
  name={myName}
  onQuit={handleQuit}
  points={gameState.totalScores[localUid] ?? 0}
  question={roundOver ? undefined : t.contourGame.guessPrompt}
  roundNumber={gameState.roundIndex + 1}
  totalRounds={gameState.countryCodes.length}
/>
```
