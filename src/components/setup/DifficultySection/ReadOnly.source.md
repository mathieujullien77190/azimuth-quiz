```tsx
import DifficultySection from '@/components/setup/DifficultySection';

<DifficultySection
  disabled
  hint={t.setup.difficultyHint}
  onSelect={notifyReadOnly}
  selected={hostSettings.difficulty}
  title={t.setup.difficultyTitle}
/>
```
