```tsx
import ClueGrid from '@/games/clues/components/ClueGrid';

// `roundOver` reveals everything, whatever was actually picked.
<ClueGrid
  bearingDeg={bearing}
  distanceKm={distance}
  place={place}
  revealedClueIds={gameState.revealedClueIds}
  roundOver
/>
```
