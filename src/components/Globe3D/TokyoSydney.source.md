```tsx
import Globe3D from '@/components/Globe3D';

// It first shows the side of the Earth where the starting point and the answers are: here the route heads south, its
// far end is behind the ball until the globe is turned (or zoomed, then put back north with "⌖ N").
<Globe3D
  marks={[{ bearing: 171.2, distanceKm: 7826, color: playerColor }]}
  origin={{ latitude: 35.68, longitude: 139.69 }}
  size={earthSizeFor(width)}
/>
```
