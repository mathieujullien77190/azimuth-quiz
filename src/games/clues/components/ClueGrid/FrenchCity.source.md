```tsx
import ClueGrid from '@/games/clues/components/ClueGrid';

// `place.name`/`place.code` decide the offered clue set on their own (`cluesFor`): a citiesFr
// place like Marseille shows fewer cards, with no special prop to pass.
<ClueGrid
  bearingDeg={bearing}
  distanceKm={distance}
  onPickClue={isMyTurn ? pickClue : undefined}
  place={place}
  revealedClueIds={gameState.revealedClueIds}
  roundOver={verdict !== undefined}
/>
```
