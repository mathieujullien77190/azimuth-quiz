```tsx
import FinalStandings from '@/components/FinalStandings';

// The podium gets medals, the fourth player and beyond their rank number; tied totals share a rank.
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
