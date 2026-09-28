```tsx
import DifficultySection from '@/components/setup/DifficultySection';

// One difficulty in every game: a click replaces the selection.
<DifficultySection
  hint={t.cluesSetup.difficultyHint}
  onSelect={(id) => updateOrNotify({ difficulty: id })}
  selected={settings.difficulty}
  title={t.cluesSetup.difficultyTitle}
/>
```
