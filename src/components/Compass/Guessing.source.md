```tsx
import { useState } from 'react';

import Compass from '@/components/Compass';

const [bearing, setBearing] = useState(0);

// Controlled: the dial only reports where it was clicked or dragged, the caller owns the value.
<Compass
  needles={[{ bearing, color: playerColor }]}
  onChange={setBearing}
  size={compassSizeFor(width)}
/>
```
