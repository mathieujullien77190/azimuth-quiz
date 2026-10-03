```tsx
import Globe3D from '@/components/Globe3D';

// No land: the equator and the Greenwich meridian (dashed) are the only landmarks, next to the starting point ("toi")
// and the place (circled). Leave `land` out (it defaults to true) to draw the world as well. `draggable={false}` takes
// the turning, the zoom and their buttons away: here the taps belong to the clue card underneath.
<Globe3D
  equator
  greenwich
  land={false}
  draggable={false}
  marks={[{ bearing: 261.4, distanceKm: 6079, color: playerColor, isTruth: true }]}
  origin={{ latitude: 48.8566, longitude: 2.3522 }}
  size={earthSizeFor(width)}
/>
```
