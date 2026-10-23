```tsx
import FooterNav from '@/games/components/FooterNav';

// Both the heading and the distance must have been touched before "Valider" turns on.
<FooterNav
  onCap
  onGoToCap={goToCap}
  onGoToDistance={goToDistance}
  onValidate={submit}
  validateDisabled={!bearingTouched || !distanceTouched}
/>
```
