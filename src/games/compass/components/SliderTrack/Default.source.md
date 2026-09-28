```tsx
import SliderTrack from '@/games/compass/components/SliderTrack';

// The generic logarithmic-scale track behind `DistanceSlider`: a ratio in [0, 1], its label, marks.
<SliderTrack
  label={t.sliders.distance}
  marks={marks}
  onRatioChange={(ratio) => setDistanceKm(ratioToKm(ratio, maxKm))}
  ratio={kmToRatio(distanceKm, maxKm)}
  valueText={formatDistance(distanceKm)}
/>
```
