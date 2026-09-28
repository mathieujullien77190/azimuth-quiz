```tsx
import ClueGrid from '@/games/clues/components/ClueGrid';

// Not your turn: no `onPickClue`, so every card is read-only.
<ClueGrid
  bearingDeg={bearing}
  distanceKm={distance}
  place={place}
  revealedClueIds={gameState.revealedClueIds}
  roundOver={false}
/>
```
