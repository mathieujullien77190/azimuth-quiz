```tsx
import Globe3D from '@/components/Globe3D';

// The same answers as the Earth seen from the side (`EarthMark`: heading + surface distance) plus the starting point.
// The globe turns with a finger; each answer is its great-circle route, cut where it goes behind the ball.
<Globe3D
  marks={[{ bearing: 291.6, distanceKm: 5837, color: playerColor, isTruth: true }]}
  origin={{ latitude: 48.8566, longitude: 2.3522 }}
  size={earthSizeFor(width)}
/>
```
