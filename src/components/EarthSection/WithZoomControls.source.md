```tsx
import EarthSection from '@/components/EarthSection';

// At reveal: +/- buttons (and the orbiting satellite at full zoom-out). A new `key` per round resets
// the manual zoom.
<EarthSection
  key={roundNumber}
  marks={earthMarks}
  size={earthSizeFor(width)}
  zoomControls
/>
```
