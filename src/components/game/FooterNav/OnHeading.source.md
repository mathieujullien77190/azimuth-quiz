```tsx
import FooterNav from '@/components/game/FooterNav';

// `onCap` mirrors the scroll position (kept in sync by the parent's `onScroll`), not local state.
<FooterNav
  onCap={onCap}
  onGoToCap={goToCap}
  onGoToDistance={goToDistance}
  onValidate={submit}
  validateDisabled={!bearingTouched || !distanceTouched}
/>
```
