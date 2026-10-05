```tsx
import ContourQuadrantMask from '@/games/contour/components/ContourQuadrantMask';

// Everybody else's view: the same cells are hidden, but they are plain locks: nothing to tap, nothing to pay.
<ContourQuadrantMask canReveal={false} {...maskProps} />
```
