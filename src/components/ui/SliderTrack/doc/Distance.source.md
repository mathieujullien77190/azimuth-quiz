```tsx
import SliderTrack from '@/components/ui/SliderTrack';

// Compass' distance slider: a logarithmic scale, converted with `ratioToKm` / `kmToRatio`.
<SliderTrack
  label={t.sliders.distance}
  marks={marks}
  onRatioChange={(ratio) => setDistanceKm(ratioToKm(ratio, maxKm))}
  ratio={kmToRatio(distanceKm, maxKm)}
  valueText={formatDistance(distanceKm)}
/>
```
