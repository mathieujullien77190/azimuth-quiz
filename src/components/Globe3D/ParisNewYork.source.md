```tsx
import Globe3D from '@/components/Globe3D';

// The same answers as the Earth seen from the side (`EarthMark`: heading + surface distance) plus the starting point.
// A real ball drawn with three.js: one finger turns it, two fingers zoom, the "⌖ N" button puts it back. Each answer is
// its constant-heading route (rhumb line), hidden by the globe itself where it passes behind.
<Globe3D
  marks={[{ bearing: 261.4, distanceKm: 6079, color: playerColor, isTruth: true }]}
  origin={{ latitude: 48.8566, longitude: 2.3522 }}
  size={earthSizeFor(width)}
/>
```
