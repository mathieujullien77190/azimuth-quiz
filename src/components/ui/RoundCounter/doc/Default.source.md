```tsx
import RoundCounter from '@/components/ui/RoundCounter';

// "Manche 3 / 10" — `GameHeader` puts it beside the round's `DifficultyBadge`.
<RoundCounter roundNumber={gameState.roundIndex + 1} totalRounds={gameState.places.length} />
```
