```tsx
import Compass from '@/components/Compass';

// Reveal: every player's needle, plus the true bearing marked on the dial. No `onChange` — it's
// read-only.
<Compass
  needles={results.map((result, index) => ({ bearing: result.guess.bearing, color: players[index].color }))}
  size={compassSizeFor(width)}
  truthBearing={truth.trueBearing}
/>
```
