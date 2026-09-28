```tsx
import FooterNav from '@/games/compass/components/FooterNav';

// `onCap` mirrors the scroll position (kept in sync by the parent's `onScroll`), not local state.
<FooterNav
  onCap={onCap}
  onGoToCap={goToCap}
  onGoToDistance={goToDistance}
  onValidate={submit}
  validateDisabled={!bearingTouched || !distanceTouched}
/>
```
