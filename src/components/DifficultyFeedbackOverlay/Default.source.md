```tsx
import DifficultyFeedbackOverlay from '@/components/DifficultyFeedbackOverlay';

// The dev mode's question after a round. A tap on an answer calls `onChoose`; a tap anywhere else
// calls `onDismiss` and the game goes on. `question` null hides it.
<DifficultyFeedbackOverlay
  onChoose={(difficulty) => choose(difficulty)}
  onDismiss={dismiss}
  question={t.devFeedback.placeQuestion('Paris')}
/>
```
