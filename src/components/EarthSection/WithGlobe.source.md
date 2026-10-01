```tsx
import EarthSection from '@/components/EarthSection';

// With the starting point, the whole-Earth view (zoom 1) shows a globe turned with a finger first, with a "2D" switch back to the Earth seen from the side: only the
// long answers need it, zooming in again brings the Earth back.
<EarthSection
  marks={[{ bearing: 291.6, distanceKm: 5837, color: playerColor, isTruth: true }]}
  origin={{ latitude: 48.8566, longitude: 2.3522 }}
  size={160}
  zoomControls
/>
```
