```tsx
import Globe3D from '@/components/Globe3D';

// No land: the equator and the Greenwich meridian (dashed) are the only landmarks, next to the starting point ("toi")
// and the place (circled). Leave `land` out (it defaults to true) to draw the world as well.
<Globe3D
  equator
  greenwich
  land={false}
  marks={[{ bearing: 291.6, distanceKm: 5837, color: playerColor, isTruth: true }]}
  origin={{ latitude: 48.8566, longitude: 2.3522 }}
  size={earthSizeFor(width)}
/>
```
