```tsx
import DifficultySection from '@/components/setup/DifficultySection';

// One difficulty: a click replaces the selection.
<DifficultySection
  hint={t.setup.difficultyHint}
  onSelect={(id) => updateOrNotify({ difficulty: id })}
  selected={settings.difficulty}
  title={t.setup.difficultyTitle}
/>
```
