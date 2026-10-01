```tsx
import ClueCard from '@/games/clues/components/ClueCard';

// 1st click: the starting point ("toi") and the place (circled) on a bare ball turned with a finger, with the equator
// and the Greenwich meridian to read where it is.
<ClueCard
  bearingDeg={bearingDeg}
  clueId="globe"
  distanceKm={distanceKm}
  globeStage={1}
  label={t.cluesGame.clues.globe}
  origin={origin}
  place={place}
  state="revealed"
/>
```
