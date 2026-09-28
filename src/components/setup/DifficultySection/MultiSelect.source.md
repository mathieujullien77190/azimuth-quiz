```tsx
import DifficultySection from '@/components/setup/DifficultySection';

// Compass: several difficulties at once — `selected` is the list, each click toggles one.
<DifficultySection
  hint={t.setup.difficultyHint}
  onSelect={(id) => updateOrNotify(selectDifficultyFilter(settings, id))}
  selected={settings.difficulties}
  title={t.setup.difficultyTitle}
/>
```
