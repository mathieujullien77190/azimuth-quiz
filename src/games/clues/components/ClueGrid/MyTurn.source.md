```tsx
import ClueGrid from '@/games/clues/components/ClueGrid';

// `onPickClue` given: the unrevealed cards are tappable (a pick passes the turn).
<ClueGrid
  bearingDeg={bearing}
  distanceKm={distance}
  onPickClue={isMyTurn ? pickClue : undefined}
  place={place}
  revealedClueIds={gameState.revealedClueIds}
  roundOver={verdict !== undefined}
/>
```
