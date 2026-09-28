```tsx
import FinalStandings from '@/components/FinalStandings';

<FinalStandings
  entries={onlinePlayers.map((player) => ({
    name: player.name,
    total: gameState.totalScores[player.uid] ?? 0,
    color: player.color,
  }))}
  homeLabel={t.endScreen.menu}
  onHome={handleQuit}
  title={t.endScreen.title}
/>
```
