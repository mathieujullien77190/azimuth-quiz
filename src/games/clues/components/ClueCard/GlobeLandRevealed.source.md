```tsx
import ClueCard from '@/games/clues/components/ClueCard';

// 2nd click: the world's land is drawn on the globe as well (the equator and the Greenwich meridian stay).
<ClueCard
  bearingDeg={bearingDeg}
  clueId="globe"
  distanceKm={distanceKm}
  globeStage={2}
  label={t.cluesGame.clues.globe}
  origin={origin}
  place={place}
  state="revealed"
/>
```
