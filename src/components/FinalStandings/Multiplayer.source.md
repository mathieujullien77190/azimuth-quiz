```tsx
import FinalStandings from '@/components/FinalStandings';

<FinalStandings
  entries={onlinePlayers.map((player) => ({
    name: player.name,
    total: gameState.totalScores[player.uid] ?? 0,
    color: player.color,
  }))}
  title={t.endScreen.title}

  onQuit={handleQuit}
  onReplay={handleReplay}
/>
```
