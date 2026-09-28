```tsx
import DifficultySection from '@/components/setup/DifficultySection';

// Clues and Silhouette: one difficulty — wrap it in an array, a click replaces the selection.
<DifficultySection
  hint={t.cluesSetup.difficultyHint}
  onSelect={(id) => updateOrNotify({ difficulty: id })}
  selected={[settings.difficulty]}
  title={t.cluesSetup.difficultyTitle}
/>
```
