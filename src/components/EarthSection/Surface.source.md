```tsx
import EarthSection from '@/components/EarthSection';

// One mark per answer; the true one is `isTruth` (a ring, no arc). The zoom follows the marks: the
// closer they are, the more it zooms in.
<EarthSection
  marks={[{ bearing: 60, distanceKm: 3000, color: playerColor, isTruth: true }]}
  size={earthSizeFor(width)}
/>
```
