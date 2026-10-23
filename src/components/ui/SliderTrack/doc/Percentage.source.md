```tsx
import { useState } from 'react';

import SliderTrack from '@/components/ui/SliderTrack';

// Controlled: the track reports a ratio in [0, 1], the caller owns it and derives whatever text it shows.
const [ratio, setRatio] = useState(0.3);

<SliderTrack
  label="Volume"
  marks={[
    { ratio: 0, label: '0 %' },
    { ratio: 0.5, label: '50 %' },
    { ratio: 1, label: '100 %' },
  ]}
  onRatioChange={setRatio}
  ratio={ratio}
  valueText={`${Math.round(ratio * 100)} %`}
/>
```
