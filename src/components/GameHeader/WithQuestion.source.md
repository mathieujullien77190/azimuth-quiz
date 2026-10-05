```tsx
import GameHeader from '@/components/GameHeader';

// `question` sits centered at the bottom of the header, `questionDetail` on the right of the same row (the question then on the left);
// leave both out once the round is over.
<GameHeader
  code={code}
  difficulty={roomSettings.difficulty}
  name={myName}
  onQuit={handleQuit}
  points={gameState.totalScores[localUid] ?? 0}
  question={roundOver ? undefined : t.contourGame.guessPrompt}
  questionDetail={roundOver ? undefined : `${formatNumber(pointsAtStake)} ${t.common.pts}`}
  roundNumber={gameState.roundIndex + 1}
  totalRounds={gameState.countryCodes.length}
/>
```
