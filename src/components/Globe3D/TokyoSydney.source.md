```tsx
import Globe3D from '@/components/Globe3D';

// It first shows the side of the Earth where the starting point and the answers are: here the route heads south, its
// far end is behind the ball until the globe is turned.
<Globe3D
  marks={[{ bearing: 160, distanceKm: 7800, color: playerColor }]}
  origin={{ latitude: 35.68, longitude: 139.69 }}
  size={earthSizeFor(width)}
/>
```
