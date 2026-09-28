```tsx
import FinalStandings from '@/components/FinalStandings';

<FinalStandings
  entries={onlinePlayers.map((player) => ({ name: player.name, total: gameState.totalScores[player.uid] ?? 0 }))}
  homeLabel={t.contourGame.home}
  onHome={handleQuit}
  title={t.contourGame.finalScoreTitle}
/>
```
